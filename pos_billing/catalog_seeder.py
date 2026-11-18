import random
from pos_billing.models import Product, BranchInventory

# 👗 कपड़े, गारमेंट्स व फुटवियर का रेडीमेड मास्टर कैटलॉग
APPAREL_CATALOG = [
    {"name": "Men's Slim Fit Denim Jeans (Blue)", "sku": "APP-JNS-001", "hsn": "6203", "cost": 450.00, "price": 899.00, "gst": 12.00, "cat": "Men's Wear"},
    {"name": "Men's Cotton Formal Shirt (White, L)", "sku": "APP-SHT-002", "hsn": "6205", "cost": 320.00, "price": 649.00, "gst": 5.00, "cat": "Men's Wear"},
    {"name": "Men's Round Neck Graphic T-Shirt", "sku": "APP-TSH-003", "hsn": "6109", "cost": 150.00, "price": 349.00, "gst": 5.00, "cat": "Casual Wear"},
    {"name": "Women's Anarkali Embroidered Kurti", "sku": "APP-KRT-004", "hsn": "6204", "cost": 380.00, "price": 799.00, "gst": 5.00, "cat": "Ethnic Wear"},
    {"name": "Women's Lycra Stretch Leggings (Black)", "sku": "APP-LEG-005", "hsn": "6104", "cost": 120.00, "price": 299.00, "gst": 5.00, "cat": "Women's Wear"},
    {"name": "Kids Cotton Baba Suit (Set of 2)", "sku": "APP-KID-006", "hsn": "6111", "cost": 210.00, "price": 450.00, "gst": 5.00, "cat": "Kids Wear"},
    {"name": "Formal Trousers / Pants (Navy Blue)", "sku": "APP-TRS-007", "hsn": "6203", "cost": 350.00, "price": 750.00, "gst": 12.00, "cat": "Formal Wear"},
    {"name": "Men's Sports Running Shoes (Mesh)", "sku": "APP-SHO-008", "hsn": "6404", "cost": 400.00, "price": 899.00, "gst": 12.00, "cat": "Footwear"},
    {"name": "Leather Formal Belt (Reversible)", "sku": "APP-BLT-009", "hsn": "4203", "cost": 110.00, "price": 299.00, "gst": 18.00, "cat": "Accessories"},
    {"name": "Cotton Ankle Socks (Pack of 3)", "sku": "APP-SCK-010", "hsn": "6115", "cost": 60.00, "price": 149.00, "gst": 5.00, "cat": "Accessories"},
]

# 🛒 किराना, सुपरमार्ट व FMCG का रेडीमेड मास्टर कैटलॉग
GROCERY_CATALOG = [
    {"name": "Fortune Sunlite Refined Sunflower Oil (1L)", "sku": "8906007281014", "hsn": "1512", "cost": 115.00, "price": 135.00, "gst": 5.00, "cat": "Cooking Oils"},
    {"name": "Aashirvaad Shudh Chakki Atta (5kg)", "sku": "8901725181222", "hsn": "1101", "cost": 210.00, "price": 240.00, "gst": 0.00, "cat": "Flours & Grains"},
    {"name": "Tata Salt Vacuum Evaporated (1kg)", "sku": "8904043901005", "hsn": "2501", "cost": 23.00, "price": 28.00, "gst": 0.00, "cat": "Spices & Salt"},
    {"name": "India Gate Basmati Rice Feast Rozzana (1kg)", "sku": "8901463000108", "hsn": "1006", "cost": 85.00, "price": 105.00, "gst": 0.00, "cat": "Rice"},
    {"name": "Maggi 2-Minute Masala Noodles (70g)", "sku": "8901058852608", "hsn": "1902", "cost": 11.50, "price": 14.00, "gst": 12.00, "cat": "Instant Food"},
    {"name": "Amul Butter Pasteurised (100g)", "sku": "8901262010054", "hsn": "0405", "cost": 50.00, "price": 56.00, "gst": 12.00, "cat": "Dairy"},
    {"name": "Parle-G Gold Biscuits (1kg Pack)", "sku": "8901719101014", "hsn": "1905", "cost": 110.00, "price": 130.00, "gst": 18.00, "cat": "Snacks"},
    {"name": "Tata Tea Premium Desh Ki Chai (500g)", "sku": "8901052000517", "hsn": "0902", "cost": 230.00, "price": 270.00, "gst": 5.00, "cat": "Tea & Coffee"},
    {"name": "Surf Excel Quick Wash Detergent Powder (1kg)", "sku": "8901030383113", "hsn": "3402", "cost": 125.00, "price": 145.00, "gst": 18.00, "cat": "Cleaning"},
    {"name": "Dettol Original Bathing Soap (125g x 3)", "sku": "8901396322017", "hsn": "3401", "cost": 135.00, "price": 160.00, "gst": 18.00, "cat": "Personal Care"},
]


def seed_tenant_catalog(tenant, branch, category_type="apparel_fashion"):
    """
    व्यापारी की दुकान और पहली शाखा में रेडीमेड प्रोडक्ट्स और स्टॉक भरता है।
    """
    catalog = APPAREL_CATALOG if category_type == "apparel_fashion" else GROCERY_CATALOG

    created_count = 0
    for item in catalog:
        product, created = Product.objects.get_or_create(
            tenant=tenant,
            sku=item["sku"],
            defaults={
                "name": item["name"],
                "category": item["cat"],
                "hsn_code": item["hsn"],
                "cost_price": item["cost"],
                "price": item["price"],
                "gst_percentage": item["gst"],
                "stock_quantity": 25,
            }
        )

        # पहली शाखा में इन्वेंटरी दर्ज करें (20-30 पीस प्रत्येक)
        if branch:
            BranchInventory.objects.get_or_create(
                branch=branch,
                product=product,
                defaults={"stock": 25}
            )

        if created:
            created_count += 1

    return created_count
