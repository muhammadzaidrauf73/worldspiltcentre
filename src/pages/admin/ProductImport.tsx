import { useCallback, useEffect, useState, useRef } from 'react';
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
  AlertCircle,
  Upload,
  Pause,
  Play,
  Clock
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';

interface ListedProduct {
  url: string;
  name: string;
  image: string;
  price: number;
  original_price?: number;
  category?: string;
  selected?: boolean;
  status?: 'pending' | 'importing' | 'imported' | 'error';
  error?: string;
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
  {
    label: 'Microwave',
    url: 'https://www.lahorecentre.com/?term=microwave&s=microwave&post_type=product&taxonomy=product_cat',
  },
];

export default function ProductImport() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [searchUrl, setSearchUrl] = useState('');
  const [listedProducts, setListedProducts] = useState<ListedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceMarkup, setPriceMarkup] = useState<number>(0);
  const [turboMode, setTurboMode] = useState(true);
  
  // Pause/Resume state
  const [isPaused, setIsPaused] = useState(false);
  const pauseRef = useRef(false);
  
  // Time tracking for ETA
  const [startTime, setStartTime] = useState<number | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('');

  // Fetch existing categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const fetchProductList = useCallback(async (url: string) => {
    setIsLoading(true);
    setCurrentAction('Fetching products from page...');
    
    try {
      const { data, error } = await supabase.functions.invoke('scrape-product', {
        body: { action: 'list-products', url },
      });

      if (error) throw error;

      if (data.success && data.products && data.products.length > 0) {
        // Add selection state and override category if selected
        const productsWithSelection = data.products.map((p: ListedProduct) => ({
          ...p,
          category: selectedCategory || p.category,
          selected: true,
          status: 'pending' as const,
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
          description: `Found ${data.products.length} products with images and prices`,
        });
      } else {
        toast({
          title: 'No Products Found',
          description: 'No products were detected on that page. Try a different URL.',
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

  const toggleProduct = (url: string) => {
    setListedProducts(prev => prev.map(p => 
      p.url === url ? { ...p, selected: !p.selected } : p
    ));
  };

  const selectAll = () => {
    setListedProducts(prev => prev.map(p => ({ ...p, selected: true })));
  };

  const deselectAll = () => {
    setListedProducts(prev => prev.map(p => ({ ...p, selected: false })));
  };

  // Import selected products with real-time progress
  const importSelectedProducts = async () => {
    const selectedProducts = listedProducts.filter(p => p.selected && p.status !== 'imported');
    
    if (selectedProducts.length === 0) {
      toast({
        title: 'No Products Selected',
        description: 'Please select products to import',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    setIsPaused(false);
    pauseRef.current = false;
    setProgress(0);
    setStartTime(Date.now());
    setEstimatedTimeRemaining('Calculating...');
    
    // Ultra-fast batch size for ~24 products/second
    const BATCH_SIZE = turboMode ? 24 : 12;
    let successCount = 0;
    let errorCount = 0;
    let processed = 0;
    const batchTimes: number[] = [];

    // Process in batches for real-time progress
    for (let i = 0; i < selectedProducts.length; i += BATCH_SIZE) {
      // Check for pause
      while (pauseRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
        // Check if import was cancelled while paused
        if (!isImporting) return;
      }
      
      const batchStartTime = Date.now();
      const batch = selectedProducts.slice(i, i + BATCH_SIZE);
      const batchUrls = batch.map(p => p.url);
      
      // Update UI to show which products are being processed
      setListedProducts(prev => prev.map(p => 
        batchUrls.includes(p.url) ? { ...p, status: 'importing' as const } : p
      ));
      
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(selectedProducts.length / BATCH_SIZE);
      setCurrentAction(`${turboMode ? '⚡ Turbo: ' : ''}Batch ${batchNumber}/${totalBatches} (${batch.length} products)`);

      try {
        const { data, error } = await supabase.functions.invoke('scrape-product', {
          body: { 
            action: 'batch-import', 
            urls: batchUrls,
            categoryOverride: selectedCategory || undefined,
            priceMarkup: priceMarkup || 0,
            concurrency: BATCH_SIZE,
            turboMode: turboMode,
          },
        });

        if (error) throw error;

        if (data.success && data.results) {
          // Update status for each product in this batch
          setListedProducts(prev => prev.map(p => {
            const result = data.results.find((r: any) => r.url === p.url);
            if (result) {
              if (result.success) successCount++;
              else errorCount++;
              return {
                ...p,
                status: result.success ? 'imported' as const : 'error' as const,
                error: result.error,
              };
            }
            return p;
          }));
        }
      } catch (error) {
        console.error('Error processing batch:', error);
        // Mark batch as error
        setListedProducts(prev => prev.map(p => 
          batchUrls.includes(p.url) && p.status === 'importing' 
            ? { ...p, status: 'error' as const, error: 'Network error' } 
            : p
        ));
        errorCount += batch.length;
      }

      processed += batch.length;
      setProgress((processed / selectedProducts.length) * 100);
      
      // Calculate ETA
      const batchTime = Date.now() - batchStartTime;
      batchTimes.push(batchTime);
      const avgBatchTime = batchTimes.reduce((a, b) => a + b, 0) / batchTimes.length;
      const remainingBatches = totalBatches - batchNumber;
      const remainingMs = avgBatchTime * remainingBatches;
      
      if (remainingMs > 0) {
        const remainingSecs = Math.ceil(remainingMs / 1000);
        if (remainingSecs < 60) {
          setEstimatedTimeRemaining(`~${remainingSecs}s remaining`);
        } else {
          const mins = Math.floor(remainingSecs / 60);
          const secs = remainingSecs % 60;
          setEstimatedTimeRemaining(`~${mins}m ${secs}s remaining`);
        }
      } else {
        setEstimatedTimeRemaining('Almost done...');
      }
    }

    setIsImporting(false);
    setIsPaused(false);
    setCurrentAction('');
    setEstimatedTimeRemaining('');
    
    const totalTime = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
    toast({
      title: 'Import Complete',
      description: `Imported ${successCount} products${errorCount > 0 ? `, ${errorCount} failed` : ''} in ${totalTime}s`,
    });
  };

  // Toggle pause state
  const togglePause = () => {
    pauseRef.current = !pauseRef.current;
    setIsPaused(!isPaused);
  };

  // Cancel import
  const cancelImport = () => {
    pauseRef.current = false;
    setIsPaused(false);
    setIsImporting(false);
    setCurrentAction('');
    setEstimatedTimeRemaining('');
    
    // Reset importing status back to pending
    setListedProducts(prev => prev.map(p => 
      p.status === 'importing' ? { ...p, status: 'pending' as const } : p
    ));
    
    toast({
      title: 'Import Cancelled',
      description: 'You can resume importing the remaining products',
    });
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'imported':
        return <Badge className="bg-green-500">Imported</Badge>;
      case 'importing':
        return <Badge variant="outline" className="animate-pulse">Importing...</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Ready</Badge>;
    }
  };

  const clearAll = () => {
    setListedProducts([]);
  };

  const viewProducts = () => {
    navigate('/products');
  };

  const importedCount = listedProducts.filter(p => p.status === 'imported').length;
  const selectedCount = listedProducts.filter(p => p.selected && p.status !== 'imported').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Product Import</h1>
            <p className="text-muted-foreground mt-1">
              Import products with images, prices, and specifications from LahoreCentre
            </p>
          </div>
          <div className="flex gap-2">
            {importedCount > 0 && (
              <Button onClick={viewProducts}>
                <Check className="h-4 w-4 mr-2" />
                View Products ({importedCount})
              </Button>
            )}
            {listedProducts.length > 0 && (
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
              Quick Import Categories
            </CardTitle>
            <CardDescription>
              Click a category to fetch products instantly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_URLS.map((item) => (
                <Button
                  key={item.url}
                  variant="outline"
                  onClick={() => fetchProductList(item.url)}
                  disabled={isLoading || isImporting}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom URL with Category Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Custom URL</CardTitle>
            <CardDescription>
              Paste any LahoreCentre search or category URL to fetch products. Select a category to assign to all imported products.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://www.lahorecentre.com/?s=product+name&post_type=product"
                value={searchUrl}
                onChange={(e) => setSearchUrl(e.target.value)}
                disabled={isLoading || isImporting}
                className="flex-1"
              />
              <Button
                onClick={() => fetchProductList(searchUrl)}
                disabled={isLoading || isImporting || !searchUrl}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Fetch
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Assign Category (optional)</label>
                <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val === "auto" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-detect from page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect from page</SelectItem>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Price Markup (%)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={priceMarkup}
                    onChange={(e) => setPriceMarkup(Number(e.target.value))}
                    placeholder="0"
                    min={-50}
                    max={100}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    {priceMarkup > 0 ? `+${priceMarkup}%` : priceMarkup < 0 ? `${priceMarkup}%` : 'No markup'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Import Speed</label>
                <div className="flex items-center gap-3 mt-2">
                  <Checkbox
                    id="turboMode"
                    checked={turboMode}
                    onCheckedChange={(checked) => setTurboMode(checked === true)}
                  />
                  <label htmlFor="turboMode" className="text-sm cursor-pointer flex items-center gap-1">
                    ⚡ Turbo Mode
                    <span className="text-xs text-muted-foreground">(faster, gallery images load after)</span>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {listedProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {listedProducts.length} Products Found
                  {selectedCount > 0 && <Badge variant="outline">{selectedCount} selected</Badge>}
                  {importedCount > 0 && <Badge className="bg-green-500">{importedCount} imported</Badge>}
                </span>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={selectAll} disabled={isImporting}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll} disabled={isImporting}>
                    Deselect All
                  </Button>
                  {isImporting ? (
                    <>
                      <Button
                        variant={isPaused ? "default" : "outline"}
                        size="sm"
                        onClick={togglePause}
                      >
                        {isPaused ? (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Resume
                          </>
                        ) : (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={cancelImport}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={importSelectedProducts}
                      disabled={selectedCount === 0}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import Selected ({selectedCount})
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            
            {isImporting && (
              <CardContent className="pt-0 pb-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1 mr-4">
                      {isPaused ? (
                        <span className="text-yellow-600 font-medium">⏸ Paused - {currentAction}</span>
                      ) : (
                        currentAction
                      )}
                    </span>
                    <div className="flex items-center gap-3">
                      {estimatedTimeRemaining && (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {estimatedTimeRemaining}
                        </span>
                      )}
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                  </div>
                  <Progress value={progress} className={isPaused ? 'opacity-50' : ''} />
                </div>
              </CardContent>
            )}
            
            <CardContent className={isImporting ? 'pt-0' : 'pt-0'}>
              <ScrollArea className="h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
                  {listedProducts.map((product) => (
                    <div
                      key={product.url}
                      className={`flex flex-col rounded-lg border overflow-hidden contain-paint ${
                        product.status === 'imported' 
                          ? 'bg-green-50 dark:bg-green-950/20 border-green-200' 
                          : product.selected 
                            ? 'ring-2 ring-primary border-primary cursor-pointer' 
                            : 'hover:border-primary/50 cursor-pointer'
                      } ${product.status === 'importing' ? 'opacity-70' : ''}`}
                      onClick={() => product.status !== 'imported' && toggleProduct(product.url)}
                      style={{ contain: 'layout paint style' }}
                    >
                      <div className="aspect-square bg-muted relative">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-contain p-2"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        
                        {product.status !== 'imported' && (
                          <div className="absolute top-2 left-2">
                            <Checkbox
                              checked={product.selected}
                              onClick={(e) => e.stopPropagation()}
                              onCheckedChange={() => toggleProduct(product.url)}
                            />
                          </div>
                        )}
                        
                        <div className="absolute top-2 right-2">
                          {getStatusBadge(product.status)}
                        </div>
                        
                        {product.status === 'importing' && (
                          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                      
                      <div className="p-3 space-y-1">
                        <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                        {(product.category || selectedCategory) && (
                          <Badge variant="outline" className="text-xs">
                            {product.category || selectedCategory}
                          </Badge>
                        )}
                        <div className="flex items-center gap-2">
                          <p className="text-primary font-bold">
                            Rs. {product.price.toLocaleString()}
                          </p>
                          {product.original_price && product.original_price > product.price && (
                            <p className="text-muted-foreground text-xs line-through">
                              Rs. {product.original_price.toLocaleString()}
                            </p>
                          )}
                        </div>
                        {product.error && (
                          <p className="text-destructive text-xs flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {product.error}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && listedProducts.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Products Yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Click a category above or paste a URL to fetch products from LahoreCentre. 
                Products will be shown with images, prices, and you can import them with one click.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
