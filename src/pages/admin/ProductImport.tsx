import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

interface ListedProduct {
  url: string;
  name: string;
  image: string;
  price: number;
  selected?: boolean;
}

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
    label: 'Air Fryers',
    url: 'https://www.lahorecentre.com/?term=air-fryer&s=air+fryer&post_type=product&taxonomy=product_cat',
  },
  {
    label: 'Washing Machines',
    url: 'https://www.lahorecentre.com/?term=washing+machine&s=washing+machine&post_type=product&taxonomy=product_cat',
  },
  {
    label: 'LED TVs',
    url: 'https://www.lahorecentre.com/?term=led+tv&s=led+tv&post_type=product&taxonomy=product_cat',
  },
];

export default function ProductImport() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [searchUrl, setSearchUrl] = useState('');
  const [listedProducts, setListedProducts] = useState<ListedProduct[]>([]);
  const [scrapedProducts, setScrapedProducts] = useState<ScrapedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState('');

  const fetchProductList = useCallback(async (url: string) => {
    setIsLoading(true);
    setCurrentAction('Fetching products...');
    
    try {
      const { data, error } = await supabase.functions.invoke('scrape-product', {
        body: { action: 'list-products', url },
      });

      if (error) throw error;

      if (data.success && data.products && data.products.length > 0) {
        // Add selection state to products
        const productsWithSelection = data.products.map((p: ListedProduct) => ({
          ...p,
          selected: true,
        }));
        
        // Merge with existing products, avoiding duplicates by URL
        setListedProducts(prev => {
          const combined = [...prev];
          for (const newProduct of productsWithSelection) {
            if (!combined.some(p => p.url === newProduct.url)) {
              combined.push(newProduct);
            }
          }
          return combined;
        });
        
        toast({
          title: 'Products Found',
          description: `Found ${data.products.length} products with images`,
        });
      } else {
        toast({
          title: 'No Products Found',
          description: 'No products were detected on that page.',
          variant: 'destructive',
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
  }, [toast]);

  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam) {
      setSearchUrl(urlParam);
      fetchProductList(urlParam);
    }
  }, [searchParams, fetchProductList]);

  const toggleListedProduct = (url: string) => {
    setListedProducts(prev => prev.map(p => 
      p.url === url ? { ...p, selected: !p.selected } : p
    ));
  };

  const selectAllListed = () => {
    setListedProducts(prev => prev.map(p => ({ ...p, selected: true })));
  };

  const deselectAllListed = () => {
    setListedProducts(prev => prev.map(p => ({ ...p, selected: false })));
  };

  const scrapeSelectedProducts = async () => {
    const selectedProducts = listedProducts.filter(p => p.selected);
    
    if (selectedProducts.length === 0) {
      toast({
        title: 'No Products Selected',
        description: 'Please select products to scrape',
        variant: 'destructive',
      });
      return;
    }

    setIsScraping(true);
    setProgress(0);
    
    const results: ScrapedProduct[] = [];
    
    for (let i = 0; i < selectedProducts.length; i++) {
      const product = selectedProducts[i];
      setCurrentAction(`Scraping: ${product.name} (${i + 1}/${selectedProducts.length})`);
      setProgress(((i + 1) / selectedProducts.length) * 100);

      try {
        const { data, error } = await supabase.functions.invoke('scrape-product', {
          body: { action: 'scrape-product', url: product.url },
        });

        if (error) throw error;

        if (data.success && data.product) {
          results.push({
            ...data.product,
            status: 'scraped',
            selected: true,
          });
        } else {
          results.push({
            name: product.name,
            slug: product.url.split('/').slice(-2)[0],
            price: product.price,
            brand: 'Unknown',
            category: 'Unknown',
            images: product.image ? [product.image] : [],
            source_url: product.url,
            status: 'error',
            error: data.error || 'Failed to scrape details',
            selected: false,
          });
        }
      } catch (error) {
        console.error(`Error scraping ${product.url}:`, error);
        results.push({
          name: product.name,
          slug: product.url.split('/').slice(-2)[0],
          price: product.price,
          brand: 'Unknown',
          category: 'Unknown',
          images: product.image ? [product.image] : [],
          source_url: product.url,
          status: 'error',
          error: 'Network error',
          selected: false,
        });
      }

      // Update UI after each product
      setScrapedProducts([...results]);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsScraping(false);
    setCurrentAction('');
    
    toast({
      title: 'Scraping Complete',
      description: `Scraped ${results.filter(p => p.status === 'scraped').length} products successfully`,
    });
  };

  const importSelectedProducts = async () => {
    const selectedProducts = scrapedProducts.filter(p => p.selected && p.status === 'scraped');
    
    if (selectedProducts.length === 0) {
      toast({
        title: 'No Products Selected',
        description: 'Please select scraped products to import',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    setProgress(0);

    for (let i = 0; i < selectedProducts.length; i++) {
      const product = selectedProducts[i];
      setCurrentAction(`Importing: ${product.name} (${i + 1}/${selectedProducts.length})`);
      setProgress(((i + 1) / selectedProducts.length) * 100);

      try {
        const { data, error } = await supabase.functions.invoke('scrape-product', {
          body: { action: 'import-product', product },
        });

        if (error) throw error;

        setScrapedProducts(prev => prev.map(p => 
          p.slug === product.slug 
            ? { ...p, status: 'imported' as const }
            : p
        ));
      } catch (error) {
        console.error(`Error importing ${product.name}:`, error);
        setScrapedProducts(prev => prev.map(p => 
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

  const toggleScrapedProduct = (slug: string) => {
    setScrapedProducts(prev => prev.map(p => 
      p.slug === slug ? { ...p, selected: !p.selected } : p
    ));
  };

  const selectAllScraped = () => {
    setScrapedProducts(prev => prev.map(p => ({ ...p, selected: p.status === 'scraped' })));
  };

  const deselectAllScraped = () => {
    setScrapedProducts(prev => prev.map(p => ({ ...p, selected: false })));
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

  const clearAll = () => {
    setListedProducts([]);
    setScrapedProducts([]);
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
          <div className="flex gap-2">
            {(listedProducts.length > 0 || scrapedProducts.length > 0) && (
              <Button variant="outline" onClick={clearAll}>
                Clear All
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/admin/products')}>
              Back to Products
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Quick Import
            </CardTitle>
            <CardDescription>
              Click to fetch products from lahorecentre.com categories
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
              Enter a search or category URL to fetch products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="https://www.lahorecentre.com/?s=product+name&post_type=product"
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

        {/* Listed Products (from search) */}
        {listedProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Found {listedProducts.length} Products ({listedProducts.filter(p => p.selected).length} selected)
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllListed}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllListed}>
                    Deselect All
                  </Button>
                  <Button
                    onClick={scrapeSelectedProducts}
                    disabled={isScraping || isImporting || listedProducts.filter(p => p.selected).length === 0}
                  >
                    {isScraping ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Scraping...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Scrape Selected & Download Images
                      </>
                    )}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            {isScraping && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1 mr-4">{currentAction}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              </CardContent>
            )}
            <CardContent className={isScraping ? '' : 'pt-0'}>
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {listedProducts.map((product) => (
                    <div
                      key={product.url}
                      className={`flex flex-col rounded-lg border overflow-hidden cursor-pointer transition-all ${
                        product.selected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'
                      }`}
                      onClick={() => toggleListedProduct(product.url)}
                    >
                      <div className="aspect-square bg-muted relative">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <Checkbox
                            checked={product.selected}
                            onClick={(e) => e.stopPropagation()}
                            onCheckedChange={() => toggleListedProduct(product.url)}
                          />
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                        <p className="text-primary font-semibold mt-1">
                          Rs. {product.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Scraped Products (with full details) */}
        {scrapedProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Scraped Products ({scrapedProducts.filter(p => p.selected).length} selected for import)</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllScraped}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllScraped}>
                    Deselect All
                  </Button>
                  <Button
                    onClick={importSelectedProducts}
                    disabled={isImporting || scrapedProducts.filter(p => p.selected && p.status === 'scraped').length === 0}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Import to Database
                      </>
                    )}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            {isImporting && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1 mr-4">{currentAction}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              </CardContent>
            )}
            <CardContent className={isImporting ? '' : 'pt-0'}>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {scrapedProducts.map((product) => (
                    <div
                      key={product.slug}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        product.status === 'error' ? 'border-destructive/50 bg-destructive/5' : 
                        product.status === 'imported' ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20' : 'bg-card'
                      }`}
                    >
                      <Checkbox
                        checked={product.selected}
                        onCheckedChange={() => toggleScrapedProduct(product.slug)}
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
                          {product.description && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[200px]">{product.description.substring(0, 50)}...</span>
                            </>
                          )}
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
