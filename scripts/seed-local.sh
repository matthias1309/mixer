#!/bin/bash
set -e

echo "========================================="
echo "Recipe Manager - Seed Development Data"
echo "========================================="
echo ""

API_URL="${API_URL:-http://localhost:3000}"
SEED_USER_EMAIL="dev-seed@local.test"
SEED_USER_PASSWORD="dev-seed-password"

# Check if API is reachable
echo "Checking API connectivity..."
if ! curl -s "$API_URL/api/recipes" > /dev/null 2>&1; then
    echo "❌ API is not reachable at $API_URL"
    echo "Please start the app first: npm run dev"
    exit 1
fi

echo "✓ API is reachable"
echo ""

# Register a seed user if not exists
echo "[1/2] Registering seed user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$SEED_USER_EMAIL\",
        \"password\": \"$SEED_USER_PASSWORD\"
    }")

# Check if registration was successful (or if user already exists)
if echo "$REGISTER_RESPONSE" | grep -q "\"id\""; then
    echo "    ✓ Seed user registered"
else
    echo "    ℹ Seed user might already exist, continuing..."
fi

# Login and get session
echo "[2/2] Seeding 29 nutrition ingredients..."

# Create a temp file for cookies
COOKIES_FILE=$(mktemp)
trap "rm -f $COOKIES_FILE" EXIT

# Login to get session
curl -s -c "$COOKIES_FILE" -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$SEED_USER_EMAIL\",
        \"password\": \"$SEED_USER_PASSWORD\"
    }" > /dev/null

# Array of ingredients to seed (from src/db/seeds/ingredients.ts)
declare -a INGREDIENTS=(
    '{"name":"Apple","category":"Fruit","base_unit":"g","base_size":100,"kcal":52,"iron":0.26,"sugar":10.39,"fat":0.17,"protein":0.26,"carbohydrates":13.81,"fiber":2.4,"sodium":2,"calcium":6,"vitamin_d":0,"magnesium":5,"vitamin_b6":0.05,"vitamin_b12":0,"vitamin_e":0.18,"zinc":0.04}'
    '{"name":"Banana","category":"Fruit","base_unit":"g","base_size":100,"kcal":89,"iron":0.26,"sugar":12.23,"fat":0.33,"protein":1.09,"carbohydrates":22.84,"fiber":2.6,"sodium":2,"calcium":5,"vitamin_d":0,"magnesium":27,"vitamin_b6":0.37,"vitamin_b12":0,"vitamin_e":0.1,"zinc":0.15}'
    '{"name":"Orange","category":"Fruit","base_unit":"g","base_size":100,"kcal":47,"iron":0.1,"sugar":9.35,"fat":0.12,"protein":0.91,"carbohydrates":11.75,"fiber":2.4,"sodium":1,"calcium":40,"vitamin_d":0,"magnesium":10,"vitamin_b6":0.06,"vitamin_b12":0,"vitamin_e":0.18,"zinc":0.07}'
    '{"name":"Strawberry","category":"Fruit","base_unit":"g","base_size":100,"kcal":32,"iron":0.41,"sugar":7.02,"fat":0.3,"protein":0.67,"carbohydrates":7.68,"fiber":2,"sodium":2,"calcium":16,"vitamin_d":0,"magnesium":13,"vitamin_b6":0.06,"vitamin_b12":0,"vitamin_e":0.29,"zinc":0.14}'
    '{"name":"Blueberry","category":"Fruit","base_unit":"g","base_size":100,"kcal":57,"iron":0.3,"sugar":9.96,"fat":0.33,"protein":0.74,"carbohydrates":14.49,"fiber":2.4,"sodium":1,"calcium":6,"vitamin_d":0,"magnesium":6,"vitamin_b6":0.07,"vitamin_b12":0,"vitamin_e":0.57,"zinc":0.16}'
    '{"name":"Carrot","category":"Vegetable","base_unit":"g","base_size":100,"kcal":41,"iron":0.3,"sugar":4.74,"fat":0.24,"protein":0.93,"carbohydrates":9.58,"fiber":2.8,"sodium":69,"calcium":33,"vitamin_d":0,"magnesium":12,"vitamin_b6":0.14,"vitamin_b12":0,"vitamin_e":0.66,"zinc":0.24}'
    '{"name":"Broccoli","category":"Vegetable","base_unit":"g","base_size":100,"kcal":34,"iron":0.73,"sugar":2.18,"fat":0.4,"protein":2.82,"carbohydrates":6.64,"fiber":2.4,"sodium":64,"calcium":47,"vitamin_d":0,"magnesium":21,"vitamin_b6":0.19,"vitamin_b12":0,"vitamin_e":0.78,"zinc":0.41}'
    '{"name":"Spinach","category":"Vegetable","base_unit":"g","base_size":100,"kcal":23,"iron":2.71,"sugar":0.42,"fat":0.39,"protein":2.86,"carbohydrates":3.63,"fiber":2.2,"sodium":79,"calcium":99,"vitamin_d":0,"magnesium":79,"vitamin_b6":0.17,"vitamin_b12":0,"vitamin_e":2.03,"zinc":0.53}'
    '{"name":"Tomato","category":"Vegetable","base_unit":"g","base_size":100,"kcal":18,"iron":0.3,"sugar":2.63,"fat":0.2,"protein":0.88,"carbohydrates":3.89,"fiber":1.2,"sodium":5,"calcium":12,"vitamin_d":0,"magnesium":11,"vitamin_b6":0.08,"vitamin_b12":0,"vitamin_e":0.54,"zinc":0.17}'
    '{"name":"Bell Pepper","category":"Vegetable","base_unit":"g","base_size":100,"kcal":31,"iron":0.48,"sugar":5.29,"fat":0.3,"protein":0.99,"carbohydrates":5.91,"fiber":1.7,"sodium":2,"calcium":10,"vitamin_d":0,"magnesium":12,"vitamin_b6":0.22,"vitamin_b12":0,"vitamin_e":1.58,"zinc":0.15}'
    '{"name":"Chicken Breast","category":"Protein","base_unit":"g","base_size":100,"kcal":165,"iron":1.3,"sugar":0,"fat":3.6,"protein":31,"carbohydrates":0,"fiber":0,"sodium":74,"calcium":11,"vitamin_d":0.1,"magnesium":29,"vitamin_b6":0.88,"vitamin_b12":0.3,"vitamin_e":0.31,"zinc":0.72}'
    '{"name":"Salmon","category":"Protein","base_unit":"g","base_size":100,"kcal":206,"iron":0.8,"sugar":0,"fat":13,"protein":22,"carbohydrates":0,"fiber":0,"sodium":59,"calcium":12,"vitamin_d":10.3,"magnesium":29,"vitamin_b6":0.86,"vitamin_b12":3.18,"vitamin_e":0.78,"zinc":0.8}'
    '{"name":"Egg","category":"Protein","base_unit":"g","base_size":100,"kcal":155,"iron":1.83,"sugar":1.13,"fat":11,"protein":13,"carbohydrates":1.12,"fiber":0,"sodium":124,"calcium":56,"vitamin_d":7,"magnesium":10,"vitamin_b6":0.12,"vitamin_b12":0.89,"vitamin_e":1.07,"zinc":1.29}'
    '{"name":"Greek Yogurt","category":"Dairy","base_unit":"g","base_size":100,"kcal":59,"iron":0.08,"sugar":3.25,"fat":0.4,"protein":10.19,"carbohydrates":3.25,"fiber":0,"sodium":75,"calcium":100,"vitamin_d":0,"magnesium":10,"vitamin_b6":0.07,"vitamin_b12":0.31,"vitamin_e":0.02,"zinc":0.48}'
    '{"name":"Milk","category":"Dairy","base_unit":"ml","base_size":100,"kcal":42,"iron":0.04,"sugar":4.8,"fat":1,"protein":3.2,"carbohydrates":5,"fiber":0,"sodium":44,"calcium":113,"vitamin_d":1.3,"magnesium":10,"vitamin_b6":0.06,"vitamin_b12":0.44,"vitamin_e":0.07,"zinc":0.37}'
    '{"name":"Cheese","category":"Dairy","base_unit":"g","base_size":100,"kcal":402,"iron":0.28,"sugar":1.28,"fat":33,"protein":25,"carbohydrates":1.28,"fiber":0,"sodium":621,"calcium":721,"vitamin_d":0.6,"magnesium":27,"vitamin_b6":0.08,"vitamin_b12":0.64,"vitamin_e":0.19,"zinc":2.34}'
    '{"name":"Brown Rice","category":"Grain","base_unit":"g","base_size":100,"kcal":111,"iron":0.8,"sugar":0.3,"fat":0.9,"protein":2.6,"carbohydrates":23,"fiber":1.8,"sodium":5,"calcium":10,"vitamin_d":0,"magnesium":43,"vitamin_b6":0.15,"vitamin_b12":0,"vitamin_e":0.19,"zinc":1.23}'
    '{"name":"Whole Wheat Bread","category":"Grain","base_unit":"g","base_size":100,"kcal":247,"iron":4.2,"sugar":5,"fat":3.3,"protein":13.7,"carbohydrates":41,"fiber":6.8,"sodium":450,"calcium":140,"vitamin_d":0,"magnesium":95,"vitamin_b6":0.34,"vitamin_b12":0,"vitamin_e":0.38,"zinc":3}'
    '{"name":"Oats","category":"Grain","base_unit":"g","base_size":100,"kcal":389,"iron":4.3,"sugar":0.99,"fat":6.9,"protein":16.9,"carbohydrates":66.3,"fiber":10.6,"sodium":30,"calcium":54,"vitamin_d":0,"magnesium":177,"vitamin_b6":0.12,"vitamin_b12":0,"vitamin_e":1.04,"zinc":4.27}'
    '{"name":"Sweet Potato","category":"Vegetable","base_unit":"g","base_size":100,"kcal":86,"iron":0.61,"sugar":4.2,"fat":0.1,"protein":1.57,"carbohydrates":20.1,"fiber":3,"sodium":55,"calcium":30,"vitamin_d":0,"magnesium":25,"vitamin_b6":0.28,"vitamin_b12":0,"vitamin_e":0.26,"zinc":0.3}'
    '{"name":"Avocado","category":"Fruit","base_unit":"g","base_size":100,"kcal":160,"iron":0.55,"sugar":0.66,"fat":14.7,"protein":2,"carbohydrates":8.64,"fiber":6.7,"sodium":7,"calcium":12,"vitamin_d":0,"magnesium":29,"vitamin_b6":0.26,"vitamin_b12":0,"vitamin_e":2.07,"zinc":0.64}'
    '{"name":"Almond","category":"Nut","base_unit":"g","base_size":100,"kcal":579,"iron":3.71,"sugar":4.43,"fat":49.9,"protein":21.15,"carbohydrates":21.55,"fiber":12.5,"sodium":1,"calcium":264,"vitamin_d":0,"magnesium":270,"vitamin_b6":0.14,"vitamin_b12":0,"vitamin_e":25.63,"zinc":3.08}'
    '{"name":"Walnut","category":"Nut","base_unit":"g","base_size":100,"kcal":654,"iron":2.91,"sugar":2.61,"fat":65.2,"protein":9.08,"carbohydrates":13.71,"fiber":6.7,"sodium":2,"calcium":99,"vitamin_d":0,"magnesium":158,"vitamin_b6":0.54,"vitamin_b12":0,"vitamin_e":0.42,"zinc":3.64}'
    '{"name":"Olive Oil","category":"Oil","base_unit":"ml","base_size":14,"kcal":119,"iron":0.03,"sugar":0,"fat":13.5,"protein":0,"carbohydrates":0,"fiber":0,"sodium":0,"calcium":1,"vitamin_d":0,"magnesium":0,"vitamin_b6":0,"vitamin_b12":0,"vitamin_e":1.94,"zinc":0}'
    '{"name":"Honey","category":"Sweetener","base_unit":"g","base_size":21,"kcal":64,"iron":0.09,"sugar":17.3,"fat":0,"protein":0.3,"carbohydrates":17.3,"fiber":0,"sodium":2,"calcium":1,"vitamin_d":0,"magnesium":1,"vitamin_b6":0.01,"vitamin_b12":0,"vitamin_e":0,"zinc":0.11}'
    '{"name":"Dark Chocolate","category":"Treat","base_unit":"g","base_size":30,"kcal":155,"iron":1.2,"sugar":13,"fat":12,"protein":2,"carbohydrates":16,"fiber":2.1,"sodium":2,"calcium":22,"vitamin_d":0,"magnesium":63,"vitamin_b6":0.04,"vitamin_b12":0,"vitamin_e":0.28,"zinc":0.4}'
    '{"name":"Lentils","category":"Legume","base_unit":"g","base_size":100,"kcal":116,"iron":6.51,"sugar":1.94,"fat":0.38,"protein":9.02,"carbohydrates":20.13,"fiber":7.9,"sodium":2,"calcium":19,"vitamin_d":0,"magnesium":36,"vitamin_b6":0.54,"vitamin_b12":0,"vitamin_e":0.49,"zinc":1.27}'
    '{"name":"Chickpea","category":"Legume","base_unit":"g","base_size":100,"kcal":164,"iron":2.89,"sugar":2.81,"fat":2.59,"protein":8.86,"carbohydrates":27.42,"fiber":6.4,"sodium":7,"calcium":28,"vitamin_d":0,"magnesium":48,"vitamin_b6":0.14,"vitamin_b12":0,"vitamin_e":0.35,"zinc":1.53}'
)

# Seed each ingredient
TOTAL=${#INGREDIENTS[@]}
SUCCESS=0
FAILED=0

for i in "${!INGREDIENTS[@]}"; do
    INGREDIENT="${INGREDIENTS[$i]}"
    INGREDIENT_NUM=$((i + 1))

    RESPONSE=$(curl -s -b "$COOKIES_FILE" -X POST "$API_URL/api/ingredients-master" \
        -H "Content-Type: application/json" \
        -d "$INGREDIENT")

    # Check if response contains an ID (successful creation)
    if echo "$RESPONSE" | grep -q '"id"'; then
        SUCCESS=$((SUCCESS + 1))
        echo -n "."
    else
        FAILED=$((FAILED + 1))
        echo -n "x"
    fi
done

echo ""
echo ""
echo "========================================="
echo "✓ Seeding Complete!"
echo "========================================="
echo "Results:"
echo "  ✓ Successfully seeded: $SUCCESS / $TOTAL ingredients"
if [ $FAILED -gt 0 ]; then
    echo "  ✗ Failed: $FAILED"
fi
echo ""
echo "You can now:"
echo "  - Login with: $SEED_USER_EMAIL / $SEED_USER_PASSWORD"
echo "  - View ingredients at: /ingredients"
echo "  - Create recipes at: /recipes/new"
echo ""
echo "========================================="
