# Product Import Template

## Excel/CSV Format

Create a spreadsheet with the following columns:

| name | brand | description | price | originalPrice | image | category | rating | reviews | recommended | tags | investmentType |
|------|-------|-------------|-------|---------------|-------|----------|--------|---------|-------------|------|----------------|
| Master Facial Cream | Rashida | Premium anti-aging cream | 29.99 | 39.99 | https://images.unsplash.com/photo-1556228720-195a672e8a03 | Beauty | 4.5 | 128 | true | beauty,skincare,antiaging | passion,income |
| Protein Powder | FitLife | Organic whey protein | 49.99 | 59.99 | https://images.unsplash.com/photo-1579722821273-0f6c7d44362f | Fitness | 4.8 | 256 | true | fitness,health,protein | maximize,save |

## Column Descriptions:

- **name**: Product name (required)
- **brand**: Brand name (required)
- **description**: Product description (required)
- **price**: Current price in dollars (required)
- **originalPrice**: Original price before discount (optional)
- **image**: Image URL (required) - Use Unsplash URLs or upload base64 images
- **category**: One of: Beauty, Skincare, Fitness, Tech, Home, Food, Fashion, Books, Pets, Art, Gaming, Grocery
- **rating**: Rating from 0-5 (decimal allowed)
- **reviews**: Number of reviews (integer)
- **recommended**: true or false
- **tags**: Comma-separated tags (e.g., "beauty,skincare,luxury")
- **investmentType**: Comma-separated types (passion, income, save, maximize)

## Notes:

- First row must contain column headers exactly as shown above
- Save as .xlsx or .xls format
- Ensure all required fields are filled
- Use true/false for recommended column
- Tags and investmentType should be comma-separated without spaces
