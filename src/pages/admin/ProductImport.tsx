import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Download, 
  Loader2, 
  Check, 
  X, 
  Image as ImageIcon,
  Package,
  AlertCircle
} from 'lucide-react';

interface ScrapedProduct {
  name: string;
  slug: string;
  price: number;
  original_price?: number;
  description?: string;
  brand: string;
  category: string;
  sku?: string;
  specifications?: Record<string, string>;
  images: string[];
  source_url: string;
  status?: 'pending' | 'scraping' | 'scraped' | 'importing' | 'imported' | 'error';
  error?: string;
  selected?: boolean;
}

const PREDEFINED_URLS = [
  {
    label: 'Air Fryers - Page 1',
    url: 'https://www.lahorecentre.com/page/1/?term&s=air+fryer&post_type=product&taxonomy=product_cat',
  },
  {
    label: 'Air Fryers - Page 2', 
    url: 'https://www.lahorecentre.com/page/2/?term&s=air+fryer&post_type=product&taxonomy=product_cat',
  },
];

export default function ProductImport() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [searchUrl, setSearchUrl] = useState('');
  const [productUrls, setProductUrls] = useState<string[]>([]);
  const [products, setProducts] = useState<ScrapedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState('');

  const fetchProductList = async (url: string) => {
    setIsLoading(true);
    setCurrentAction('Fetching product list...');
    
    try {
      const { data, error } = await supabase.functions.invoke('scrape-product', {
        body: { action: 'list-products', url },
      });

      if (error) throw error;

      if (data.success && data.productUrls) {
        // Merge with existing URLs, avoiding duplicates
        setProductUrls(prev => {
          const combined = [...prev];
          for (const newUrl of data.productUrls) {
            if (!combined.includes(newUrl)) {
              combined.push(newUrl);
            }
          }
          return combined;
        });
        
        toast({
          title: 'Products Found',
          description: `Found ${data.productUrls.length} products`,
        });
      }
    } catch (error) {
      console.error('Error fetching product list:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch product list',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setCurrentAction('');
    }
  };

  const scrapeAllProducts = async () => {
    if (productUrls.length === 0) {
      toast({
        title: 'No Products',
        description: 'Please fetch product list first',
        variant: 'destructive',
      });
      return;
    }

    setIsScraping(true);
    setProgress(0);
    
    const scrapedProducts: ScrapedProduct[] = [];
    
    for (let i = 0; i < productUrls.length; i++) {
      const url = productUrls[i];
      setCurrentAction(`Scraping product ${i + 1} of ${productUrls.length}...`);
      setProgress(((i + 1) / productUrls.length) * 100);

      try {
        const { data, error } = await supabase.functions.invoke('scrape-product', {
          body: { action: 'scrape-product', url },
        });

        if (error) throw error;

        if (data.success && data.product) {
          scrapedProducts.push({
            ...data.product,
            status: 'scraped',
            selected: true,
          });
        } else {
          scrapedProducts.push({
            name: url.split('/').slice(-2)[0].replace(/-/g, ' '),
            slug: url.split('/').slice(-2)[0],
            price: 0,
            brand: 'Unknown',
            category: 'Air Fryer',
            images: [],
            source_url: url,
            status: 'error',
            error: data.error || 'Failed to scrape',
            selected: false,
          });
        }
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        scrapedProducts.push({
          name: url.split('/').slice(-2)[0].replace(/-/g, ' '),
          slug: url.split('/').slice(-2)[0],
          price: 0,
          brand: 'Unknown',
          category: 'Air Fryer',
          images: [],
          source_url: url,
          status: 'error',
          error: 'Network error',
          selected: false,
        });
      }

      // Update UI after each product
      setProducts([...scrapedProducts]);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsScraping(false);
    setCurrentAction('');
    
    toast({
      title: 'Scraping Complete',
      description: `Scraped ${scrapedProducts.filter(p => p.status === 'scraped').length} products successfully`,
    });
  };

  const importSelectedProducts = async () => {
    const selectedProducts = products.filter(p => p.selected && p.status === 'scraped');
    
    if (selectedProducts.length === 0) {
      toast({
        title: 'No Products Selected',
        description: 'Please select products to import',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    setProgress(0);

    for (let i = 0; i < selectedProducts.length; i++) {
      const product = selectedProducts[i];
      setCurrentAction(`Importing ${product.name}...`);
      setProgress(((i + 1) / selectedProducts.length) * 100);

      try {
        const { data, error } = await supabase.functions.invoke('scrape-product', {
          body: { action: 'import-product', product },
        });

        if (error) throw error;

        // Update product status
        setProducts(prev => prev.map(p => 
          p.slug === product.slug 
            ? { ...p, status: 'imported' as const }
            : p
        ));
      } catch (error) {
        console.error(`Error importing ${product.name}:`, error);
        setProducts(prev => prev.map(p => 
          p.slug === product.slug 
            ? { ...p, status: 'error' as const, error: 'Import failed' }
            : p
        ));
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsImporting(false);
    setCurrentAction('');
    
    toast({
      title: 'Import Complete',
      description: `Imported ${selectedProducts.length} products`,
    });
  };

  const toggleProductSelection = (slug: string) => {
    setProducts(prev => prev.map(p => 
      p.slug === slug ? { ...p, selected: !p.selected } : p
    ));
  };

  const selectAll = () => {
    setProducts(prev => prev.map(p => ({ ...p, selected: p.status === 'scraped' })));
  };

  const deselectAll = () => {
    setProducts(prev => prev.map(p => ({ ...p, selected: false })));
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'scraped':
        return <Badge variant="default" className="bg-green-500">Scraped</Badge>;
      case 'imported':
        return <Badge variant="default" className="bg-blue-500">Imported</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'scraping':
        return <Badge variant="outline">Scraping...</Badge>;
      case 'importing':
        return <Badge variant="outline">Importing...</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Product Import</h1>
            <p className="text-muted-foreground mt-1">
              Scrape and import products from external websites
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/products')}>
            Back to Products
          </Button>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Quick Import - Air Fryers
            </CardTitle>
            <CardDescription>
              Click to fetch air fryer products from lahorecentre.com
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_URLS.map((item) => (
                <Button
                  key={item.url}
                  variant="outline"
                  onClick={() => fetchProductList(item.url)}
                  disabled={isLoading || isScraping}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom URL */}
        <Card>
          <CardHeader>
            <CardTitle>Custom URL</CardTitle>
            <CardDescription>
              Enter a custom product listing URL to scrape
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="https://www.lahorecentre.com/..."
                value={searchUrl}
                onChange={(e) => setSearchUrl(e.target.value)}
                disabled={isLoading || isScraping}
              />
              <Button
                onClick={() => fetchProductList(searchUrl)}
                disabled={isLoading || isScraping || !searchUrl}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Fetch
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Product URLs Found */}
        {productUrls.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Found {productUrls.length} Products
                </span>
                <Button
                  onClick={scrapeAllProducts}
                  disabled={isScraping || isImporting}
                >
                  {isScraping ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Scrape All & Download Images
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            {(isScraping || isImporting) && (
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{currentAction}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Scraped Products */}
        {products.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Scraped Products ({products.filter(p => p.selected).length} selected)</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    Deselect All
                  </Button>
                  <Button
                    onClick={importSelectedProducts}
                    disabled={isImporting || products.filter(p => p.selected && p.status === 'scraped').length === 0}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Import Selected
                      </>
                    )}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {products.map((product) => (
                    <div
                      key={product.slug}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        product.status === 'error' ? 'border-destructive/50 bg-destructive/5' : 'bg-card'
                      }`}
                    >
                      <Checkbox
                        checked={product.selected}
                        onCheckedChange={() => toggleProductSelection(product.slug)}
                        disabled={product.status === 'error' || product.status === 'imported'}
                      />
                      
                      <div className="h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        {product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{product.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{product.brand}</span>
                          <span>•</span>
                          <span>Rs. {product.price.toLocaleString()}</span>
                          <span>•</span>
                          <span>{product.images.length} images</span>
                        </div>
                        {product.error && (
                          <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            {product.error}
                          </p>
                        )}
                      </div>

                      {getStatusBadge(product.status)}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
