import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEO = ({
  title = "World Spilt Centre - Best Electronics Store in Lahore, Pakistan",
  description = "Shop quality electronics at World Spilt Centre. Air conditioners, LED TVs, refrigerators, washing machines, microwaves & home appliances. Free delivery in Lahore. Best prices guaranteed!",
  keywords = "electronics store lahore, air conditioner pakistan, LED TV lahore, refrigerator pakistan, washing machine, home appliances, world spilt centre, model town lahore, buy electronics online pakistan",
  image = "/logo.png",
  url = "",
  type = "website",
}: SEOProps) => {
  const siteName = "World Spilt Centre";
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="author" content="World Spilt Centre" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_PK" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO */}
      <meta name="geo.region" content="PK-PB" />
      <meta name="geo.placename" content="Lahore" />
      <link rel="canonical" href={url} />
    </Helmet>
  );
};

export default SEO;
