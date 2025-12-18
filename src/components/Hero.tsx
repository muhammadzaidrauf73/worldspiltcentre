import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const banners = [
  {
    id: 1,
    title: "CONSISTENT CLEANING EVERY TIME",
    subtitle: "UP TO 15% OFF",
    description: "Premium Washing Machines with Advanced Features",
    image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=1200&h=500&fit=crop",
    bgColor: "from-[#8B9A7D] to-[#6B7A5D]",
    link: "/products?category=Washing%20Machines",
  },
  {
    id: 2,
    title: "SMART TVs FOR SMART HOMES",
    subtitle: "UP TO 30% OFF",
    description: "Crystal Clear 4K Display with Smart Features",
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=1200&h=500&fit=crop",
    bgColor: "from-[#2C3E50] to-[#1A252F]",
    link: "/products?category=LED%20TV",
  },
  {
    id: 3,
    title: "BEAT THE HEAT",
    subtitle: "UP TO 25% OFF",
    description: "Energy Efficient Air Conditioners",
    image: "https://images.unsplash.com/photo-1631545806609-11e3a851df1e?w=1200&h=500&fit=crop",
    bgColor: "from-[#4A90A4] to-[#2C5F70]",
    link: "/products?category=Air%20Conditioner",
  },
  {
    id: 4,
    title: "KEEP IT FRESH",
    subtitle: "UP TO 20% OFF",
    description: "Latest Refrigerators with Inverter Technology",
    image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=1200&h=500&fit=crop",
    bgColor: "from-[#5D6D7E] to-[#3D4D5E]",
    link: "/products?category=Refrigerator",
  },
];

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  return (
    <section className="relative overflow-hidden">
      {/* Carousel */}
      <div className="relative h-[300px] md:h-[450px] lg:h-[500px]">
        {banners.map((banner, index) => (
          <Link
            key={banner.id}
            to={banner.link}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              index === currentSlide
                ? "opacity-100 translate-x-0"
                : index < currentSlide
                ? "opacity-0 -translate-x-full"
                : "opacity-0 translate-x-full"
            }`}
          >
            <div className={`relative h-full w-full bg-gradient-to-r ${banner.bgColor}`}>
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/30 to-transparent" />
              </div>

              {/* Content */}
              <div className="container mx-auto px-4 h-full flex items-center relative z-10">
                <div className="max-w-lg text-card">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-4">
                    {banner.subtitle}
                  </span>
                  <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-3">
                    {banner.title}
                  </h1>
                  <p className="text-card/80 text-base md:text-lg mb-6">
                    {banner.description}
                  </p>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6">
                    Shop Now
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center hover:bg-card transition-smooth z-20"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center hover:bg-card transition-smooth z-20"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-primary w-8"
                  : "bg-card/60 hover:bg-card"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
