import { Link } from "react-router-dom";

const brands = [
  { name: "Samsung", logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg" },
  { name: "LG", logo: "https://upload.wikimedia.org/wikipedia/commons/2/20/LG_symbol.svg" },
  { name: "Sony", logo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg" },
  { name: "Haier", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1a/Haier_logo.svg" },
  { name: "Whirlpool", logo: "https://upload.wikimedia.org/wikipedia/commons/1/14/Whirlpool_Corporation_Logo.svg" },
  { name: "Bosch", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Bosch-logo.svg" },
];

const FeaturedBrands = () => {
  return (
    <section className="py-10 bg-secondary/30 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-2">
            Shop by Brand
          </h2>
          <p className="text-sm text-muted-foreground">
            Trusted brands, guaranteed quality
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
          {brands.map((brand, index) => (
            <Link
              key={brand.name}
              to={`/products?brand=${encodeURIComponent(brand.name)}`}
              className="group animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="w-20 h-14 md:w-28 md:h-16 flex items-center justify-center p-3 rounded-lg bg-card border border-border hover:border-primary hover:shadow-md transition-smooth grayscale hover:grayscale-0 opacity-60 hover:opacity-100">
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `<span class="font-bold text-foreground text-sm">${brand.name}</span>`;
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedBrands;
