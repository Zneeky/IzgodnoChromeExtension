// extract-product-info.js
(() => {
    function extractProductInfo() {
        let name = null;
        let price = null;
        let image = null;
    
        // 1. Try Open Graph meta tags for title and price
        const ogTitle = document.querySelector('meta[property="og:title"], meta[name="og:title"]');
        if (ogTitle && ogTitle.content) {
          name = ogTitle.content;
        }
        const ogPrice = document.querySelector('meta[property="product:price:amount"]');
        const ogCurrency = document.querySelector('meta[property="product:price:currency"]');
        if (ogPrice && ogPrice.content) {
          price = ogPrice.content;
          if (ogCurrency && ogCurrency.content) {
            price += ' ' + ogCurrency.content;
          }
        }
        const ogImage = document.querySelector('meta[property="og:image"], meta[name="og:image"]');
        if (ogImage?.content) {
          image = ogImage.content;
        }
        const twitterLabel = document.querySelector('meta[name="twitter:label1"][content*="Price"]');
        const twitterPrice = document.querySelector('meta[name="twitter:data1"]');
        if (!price && twitterLabel && twitterPrice && twitterPrice.content) {
          price = twitterPrice.content;
        }

        if (!image) {
          const twitterImage = document.querySelector('meta[name="twitter:image"]');
          if (twitterImage?.content) {
            image = twitterImage.content;
          }
        }
    
        // 2. JSON-LD structured data
        if (!name || !price) {
          const scripts = document.querySelectorAll('script[type="application/ld+json"]');
          for (let script of scripts) {
            try {
              const data = JSON.parse(script.textContent);
              let productData = null;
              if (Array.isArray(data)) {
                productData = data.find(item => item["@type"] === "Product");
              } else if (data["@graph"]) {
                productData = data["@graph"].find(item => item["@type"] === "Product");
              } else if (data["@type"] === "Product") {
                productData = data;
              }
              if (productData) {
                if (!name && productData.name) {
                  name = productData.name;
                }
                if (!name && productData.title) {
                  name = productData.title;
                }
                if (!image && productData?.image) {
                  if (Array.isArray(productData.image)) {
                    image = productData.image[0]; // use first
                  } else {
                    image = productData.image;
                  }
                }
                if (!price && productData.offers) {
                  const offer = Array.isArray(productData.offers) ? productData.offers[0] : productData.offers;
                  if (offer) {
                    let priceValue = offer.price || (offer.priceSpecification ? offer.priceSpecification.price : null);
                    let currencyValue = offer.priceCurrency || (offer.priceSpecification ? offer.priceSpecification.priceCurrency : null);
                    if (priceValue) {
                      price = priceValue.toString();
                      if (currencyValue) {
                        price += ' ' + currencyValue;
                      }
                    }
                  }
                }
              }
            } catch (e) {
              continue;
            }
            if (name && price && image) break;
          }
        }
    
        // 3. Microdata
        if (!name) {
          const nameProp = document.querySelector('[itemscope][itemtype*="Product"] [itemprop="name"]');
          if (nameProp) {
            name = nameProp.textContent.trim();
          }
        }
        if (!price) {
          const priceProp = document.querySelector('[itemscope][itemtype*="Product"] [itemprop="price"]');
          if (priceProp) {
            let priceVal = priceProp.getAttribute('content') || priceProp.textContent;
            price = priceVal.trim();
            const currencyProp = document.querySelector('[itemscope][itemtype*="Product"] [itemprop="priceCurrency"]');
            if (currencyProp) {
              let currencyVal = currencyProp.getAttribute('content') || currencyProp.textContent;
              if (currencyVal) {
                price += ' ' + currencyVal.trim();
              }
            }
          }
        }
    
        // 4. Fallbacks
        if (!name) {
          const h1 = document.querySelector('h1');
          if (h1 && h1.innerText) {
            name = h1.innerText.trim();
          } else if (document.title) {
            name = document.title.trim();
          }
        }
    
        if (!price) {
          const bodyText = document.body.innerText || '';
          const pricePattern = new RegExp(
            '(?:BGN|\\u043B\\u0432\\.?|EUR|€)\\s*[\\d,.]+' +
            '|' +
            '[\\d,.]+\\s*(?:BGN|\\u043B\\u0432\\.?|EUR|€)', 'i'
          );
          const match = bodyText.match(pricePattern);
          if (match) {
            price = match[0].trim();
          }
        }

        if (!image) {
          const fallbackImg = document.querySelector('main img, [class*="product"] img');
          if (fallbackImg?.src) {
            image = fallbackImg.src;
          }
        }
    
        return { name: name || null, price: price || null, image: image || null };
    }
    
    function sendExtractedData() {
        try {
          const result = extractProductInfo();
          console.log('Extracted Product Info:', result);
          chrome.runtime.sendMessage({
            type: 'PRODUCT_INFO',
            payload: result
          });
        } catch (error) {
          chrome.runtime.sendMessage({
            type: 'PRODUCT_INFO',
            payload: {
              name: null,
              price: null,
              error: error.message
            }
          });
        }
    }
    
      // Ensure DOM is ready before running
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', sendExtractedData);
    } else {
        sendExtractedData();
    }
})(); 
  