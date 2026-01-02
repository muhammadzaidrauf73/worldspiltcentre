import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  noindex?: boolean;
}

const SEO = ({
  title = "World Spilt Centre - Best Electronics Store in Lahore, Pakistan",
  description = "Shop quality electronics at World Spilt Centre. Air conditioners, LED TVs, refrigerators, washing machines, microwaves & home appliances. Free delivery in Lahore. Best prices guaranteed!",
  keywords = "electronics store lahore, air conditioner pakistan, LED TV lahore, refrigerator pakistan, washing machine, home appliances, world spilt centre, world split centre, model town lahore, buy electronics online pakistan",
  image = "https://worldspiltcentre.com/logo.png",
  url = "https://worldspiltcentre.com",
  type = "website",
  noindex = false,
}: SEOProps) => {
  const siteName = "World Spilt Centre";
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  
  // Ensure URL is absolute
  const absoluteUrl = url.startsWith('http') ? url : `https://worldspiltcentre.com${url}`;
  
  // Ensure image is absolute
  const absoluteImage = image.startsWith('http') ? image : `https://worldspiltcentre.com${image}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1"} />
      <meta name="googlebot" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"} />
      <meta name="language" content="English" />
      <meta name="author" content="World Spilt Centre" />
      <meta name="revisit-after" content="1 days" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={absoluteUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_PK" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={absoluteUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />
      <meta name="twitter:image:alt" content={fullTitle} />

      {/* Additional SEO */}
      <meta name="geo.region" content="PK-PB" />
      <meta name="geo.placename" content="Lahore, Punjab, Pakistan" />
      <link rel="canonical" href={absoluteUrl} />
    </Helmet>
  );
};

export default SEO;
