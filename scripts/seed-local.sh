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
echo "[2/2] Seeding 75 ingredients with nutritional data..."

# Create a temp file for cookies
COOKIES_FILE=$(mktemp)
trap "rm -f $COOKIES_FILE" EXIT

# Login to get session
LOGIN_RESPONSE=$(curl -s -k -L -c "$COOKIES_FILE" -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$SEED_USER_EMAIL\",
        \"password\": \"$SEED_USER_PASSWORD\"
    }")

if ! echo "$LOGIN_RESPONSE" | grep -q '"user"'; then
    echo "❌ Login failed. Response: $LOGIN_RESPONSE"
    echo ""
    echo "Hints:"
    echo "  - For direct access (bypasses Caddy/SSL):  API_URL=http://dockerhome:3001 bash scripts/seed-local.sh"
    echo "  - For Caddy HTTPS (ignores cert errors):   API_URL=https://dockerhome.local bash scripts/seed-local.sh"
    exit 1
fi

echo "    ✓ Login successful"

# All values per 100g (or 100ml for liquids). Sources: USDA FoodData Central / BLS Nährwertdatenbank.
# Fields: name, category, base_unit, base_size, kcal, iron, sugar, fat, protein, carbohydrates, fiber, sodium, calcium, vitamin_d, magnesium, vitamin_b6, vitamin_b12, vitamin_e, zinc
declare -a INGREDIENTS=(
    # --- Obst ---
    '{"name":"Apfel","category":"Obst","base_unit":"g","base_size":100,"kcal":52,"iron":0.12,"sugar":10.39,"fat":0.17,"protein":0.26,"carbohydrates":13.81,"fiber":2.4,"sodium":1,"calcium":6,"vitamin_d":0,"magnesium":5,"vitamin_b6":0.04,"vitamin_b12":0,"vitamin_e":0.18,"zinc":0.04}'
    '{"name":"Banane","category":"Obst","base_unit":"g","base_size":100,"kcal":89,"iron":0.26,"sugar":12.23,"fat":0.33,"protein":1.09,"carbohydrates":22.84,"fiber":2.6,"sodium":1,"calcium":5,"vitamin_d":0,"magnesium":27,"vitamin_b6":0.37,"vitamin_b12":0,"vitamin_e":0.1,"zinc":0.15}'
    '{"name":"Orange","category":"Obst","base_unit":"g","base_size":100,"kcal":47,"iron":0.1,"sugar":9.35,"fat":0.12,"protein":0.91,"carbohydrates":11.75,"fiber":2.4,"sodium":0,"calcium":40,"vitamin_d":0,"magnesium":10,"vitamin_b6":0.06,"vitamin_b12":0,"vitamin_e":0.18,"zinc":0.07}'
    '{"name":"Erdbeere","category":"Obst","base_unit":"g","base_size":100,"kcal":32,"iron":0.41,"sugar":4.89,"fat":0.3,"protein":0.67,"carbohydrates":7.68,"fiber":2.0,"sodium":1,"calcium":16,"vitamin_d":0,"magnesium":13,"vitamin_b6":0.06,"vitamin_b12":0,"vitamin_e":0.29,"zinc":0.14}'
    '{"name":"Heidelbeere","category":"Obst","base_unit":"g","base_size":100,"kcal":57,"iron":0.28,"sugar":9.96,"fat":0.33,"protein":0.74,"carbohydrates":14.49,"fiber":2.4,"sodium":1,"calcium":6,"vitamin_d":0,"magnesium":6,"vitamin_b6":0.05,"vitamin_b12":0,"vitamin_e":0.57,"zinc":0.16}'
    '{"name":"Mango","category":"Obst","base_unit":"g","base_size":100,"kcal":60,"iron":0.16,"sugar":13.66,"fat":0.38,"protein":0.82,"carbohydrates":14.98,"fiber":1.6,"sodium":1,"calcium":11,"vitamin_d":0,"magnesium":10,"vitamin_b6":0.12,"vitamin_b12":0,"vitamin_e":0.9,"zinc":0.09}'
    '{"name":"Weintrauben","category":"Obst","base_unit":"g","base_size":100,"kcal":69,"iron":0.36,"sugar":15.48,"fat":0.16,"protein":0.72,"carbohydrates":18.1,"fiber":0.9,"sodium":2,"calcium":10,"vitamin_d":0,"magnesium":7,"vitamin_b6":0.09,"vitamin_b12":0,"vitamin_e":0.19,"zinc":0.07}'
    '{"name":"Kirsche","category":"Obst","base_unit":"g","base_size":100,"kcal":63,"iron":0.36,"sugar":12.82,"fat":0.2,"protein":1.06,"carbohydrates":16.01,"fiber":2.1,"sodium":0,"calcium":13,"vitamin_d":0,"magnesium":11,"vitamin_b6":0.05,"vitamin_b12":0,"vitamin_e":0.07,"zinc":0.07}'
    '{"name":"Kiwi","category":"Obst","base_unit":"g","base_size":100,"kcal":61,"iron":0.31,"sugar":8.99,"fat":0.52,"protein":1.14,"carbohydrates":14.66,"fiber":3.0,"sodium":3,"calcium":34,"vitamin_d":0,"magnesium":17,"vitamin_b6":0.06,"vitamin_b12":0,"vitamin_e":1.46,"zinc":0.14}'
    '{"name":"Avocado","category":"Obst","base_unit":"g","base_size":100,"kcal":160,"iron":0.55,"sugar":0.66,"fat":14.66,"protein":2.0,"carbohydrates":8.53,"fiber":6.7,"sodium":7,"calcium":12,"vitamin_d":0,"magnesium":29,"vitamin_b6":0.26,"vitamin_b12":0,"vitamin_e":2.07,"zinc":0.64}'
    '{"name":"Zitrone","category":"Obst","base_unit":"g","base_size":100,"kcal":29,"iron":0.6,"sugar":2.5,"fat":0.3,"protein":1.1,"carbohydrates":9.32,"fiber":2.8,"sodium":2,"calcium":26,"vitamin_d":0,"magnesium":8,"vitamin_b6":0.08,"vitamin_b12":0,"vitamin_e":0.15,"zinc":0.06}'
    '{"name":"Ananas","category":"Obst","base_unit":"g","base_size":100,"kcal":50,"iron":0.29,"sugar":9.85,"fat":0.12,"protein":0.54,"carbohydrates":13.12,"fiber":1.4,"sodium":1,"calcium":13,"vitamin_d":0,"magnesium":12,"vitamin_b6":0.11,"vitamin_b12":0,"vitamin_e":0.02,"zinc":0.12}'
    '{"name":"Birne","category":"Obst","base_unit":"g","base_size":100,"kcal":57,"iron":0.18,"sugar":9.75,"fat":0.14,"protein":0.36,"carbohydrates":15.23,"fiber":3.1,"sodium":1,"calcium":9,"vitamin_d":0,"magnesium":7,"vitamin_b6":0.03,"vitamin_b12":0,"vitamin_e":0.12,"zinc":0.1}'
    '{"name":"Pfirsich","category":"Obst","base_unit":"g","base_size":100,"kcal":39,"iron":0.25,"sugar":8.39,"fat":0.25,"protein":0.91,"carbohydrates":9.54,"fiber":1.5,"sodium":0,"calcium":6,"vitamin_d":0,"magnesium":9,"vitamin_b6":0.02,"vitamin_b12":0,"vitamin_e":0.73,"zinc":0.17}'
    '{"name":"Wassermelone","category":"Obst","base_unit":"g","base_size":100,"kcal":30,"iron":0.24,"sugar":6.2,"fat":0.15,"protein":0.61,"carbohydrates":7.55,"fiber":0.4,"sodium":1,"calcium":7,"vitamin_d":0,"magnesium":10,"vitamin_b6":0.04,"vitamin_b12":0,"vitamin_e":0.05,"zinc":0.1}'
    # --- Gemüse ---
    '{"name":"Brokkoli","category":"Gemüse","base_unit":"g","base_size":100,"kcal":34,"iron":0.73,"sugar":1.7,"fat":0.37,"protein":2.82,"carbohydrates":6.64,"fiber":2.6,"sodium":33,"calcium":47,"vitamin_d":0,"magnesium":21,"vitamin_b6":0.18,"vitamin_b12":0,"vitamin_e":0.78,"zinc":0.41}'
    '{"name":"Karotte","category":"Gemüse","base_unit":"g","base_size":100,"kcal":41,"iron":0.3,"sugar":4.74,"fat":0.24,"protein":0.93,"carbohydrates":9.58,"fiber":2.8,"sodium":69,"calcium":33,"vitamin_d":0,"magnesium":12,"vitamin_b6":0.14,"vitamin_b12":0,"vitamin_e":0.66,"zinc":0.24}'
    '{"name":"Spinat","category":"Gemüse","base_unit":"g","base_size":100,"kcal":23,"iron":2.71,"sugar":0.42,"fat":0.39,"protein":2.86,"carbohydrates":3.63,"fiber":2.2,"sodium":79,"calcium":99,"vitamin_d":0,"magnesium":79,"vitamin_b6":0.2,"vitamin_b12":0,"vitamin_e":2.03,"zinc":0.53}'
    '{"name":"Tomate","category":"Gemüse","base_unit":"g","base_size":100,"kcal":18,"iron":0.27,"sugar":2.63,"fat":0.2,"protein":0.88,"carbohydrates":3.89,"fiber":1.2,"sodium":5,"calcium":10,"vitamin_d":0,"magnesium":11,"vitamin_b6":0.08,"vitamin_b12":0,"vitamin_e":0.54,"zinc":0.17}'
    '{"name":"Paprika (rot)","category":"Gemüse","base_unit":"g","base_size":100,"kcal":31,"iron":0.43,"sugar":4.2,"fat":0.3,"protein":0.99,"carbohydrates":6.03,"fiber":2.1,"sodium":4,"calcium":7,"vitamin_d":0,"magnesium":12,"vitamin_b6":0.29,"vitamin_b12":0,"vitamin_e":1.58,"zinc":0.15}'
    '{"name":"Gurke","category":"Gemüse","base_unit":"g","base_size":100,"kcal":15,"iron":0.28,"sugar":1.67,"fat":0.11,"protein":0.65,"carbohydrates":3.63,"fiber":0.5,"sodium":2,"calcium":16,"vitamin_d":0,"magnesium":13,"vitamin_b6":0.04,"vitamin_b12":0,"vitamin_e":0.03,"zinc":0.2}'
    '{"name":"Zucchini","category":"Gemüse","base_unit":"g","base_size":100,"kcal":17,"iron":0.37,"sugar":2.5,"fat":0.32,"protein":1.21,"carbohydrates":3.11,"fiber":1.0,"sodium":8,"calcium":16,"vitamin_d":0,"magnesium":18,"vitamin_b6":0.16,"vitamin_b12":0,"vitamin_e":0.12,"zinc":0.32}'
    '{"name":"Zwiebel","category":"Gemüse","base_unit":"g","base_size":100,"kcal":40,"iron":0.21,"sugar":4.24,"fat":0.1,"protein":1.1,"carbohydrates":9.34,"fiber":1.7,"sodium":4,"calcium":23,"vitamin_d":0,"magnesium":10,"vitamin_b6":0.12,"vitamin_b12":0,"vitamin_e":0.02,"zinc":0.17}'
    '{"name":"Knoblauch","category":"Gemüse","base_unit":"g","base_size":100,"kcal":149,"iron":1.7,"sugar":1.0,"fat":0.5,"protein":6.36,"carbohydrates":33.06,"fiber":2.1,"sodium":17,"calcium":181,"vitamin_d":0,"magnesium":25,"vitamin_b6":1.24,"vitamin_b12":0,"vitamin_e":0.08,"zinc":1.16}'
    '{"name":"Süßkartoffel","category":"Gemüse","base_unit":"g","base_size":100,"kcal":86,"iron":0.61,"sugar":4.18,"fat":0.05,"protein":1.57,"carbohydrates":20.12,"fiber":3.0,"sodium":55,"calcium":30,"vitamin_d":0,"magnesium":25,"vitamin_b6":0.28,"vitamin_b12":0,"vitamin_e":0.26,"zinc":0.3}'
    '{"name":"Kartoffel","category":"Gemüse","base_unit":"g","base_size":100,"kcal":77,"iron":0.81,"sugar":0.82,"fat":0.09,"protein":2.02,"carbohydrates":17.49,"fiber":2.2,"sodium":6,"calcium":12,"vitamin_d":0,"magnesium":23,"vitamin_b6":0.3,"vitamin_b12":0,"vitamin_e":0.01,"zinc":0.3}'
    '{"name":"Kopfsalat","category":"Gemüse","base_unit":"g","base_size":100,"kcal":14,"iron":0.86,"sugar":0.7,"fat":0.22,"protein":1.36,"carbohydrates":2.23,"fiber":1.3,"sodium":10,"calcium":35,"vitamin_d":0,"magnesium":13,"vitamin_b6":0.09,"vitamin_b12":0,"vitamin_e":0.29,"zinc":0.2}'
    '{"name":"Champignon","category":"Gemüse","base_unit":"g","base_size":100,"kcal":22,"iron":0.5,"sugar":1.7,"fat":0.3,"protein":3.09,"carbohydrates":3.26,"fiber":1.0,"sodium":5,"calcium":3,"vitamin_d":0.2,"magnesium":9,"vitamin_b6":0.1,"vitamin_b12":0,"vitamin_e":0.01,"zinc":0.52}'
    '{"name":"Blumenkohl","category":"Gemüse","base_unit":"g","base_size":100,"kcal":25,"iron":0.42,"sugar":1.91,"fat":0.28,"protein":1.92,"carbohydrates":4.97,"fiber":2.0,"sodium":30,"calcium":22,"vitamin_d":0,"magnesium":15,"vitamin_b6":0.18,"vitamin_b12":0,"vitamin_e":0.08,"zinc":0.27}'
    '{"name":"Erbsen","category":"Gemüse","base_unit":"g","base_size":100,"kcal":81,"iron":1.47,"sugar":5.67,"fat":0.4,"protein":5.42,"carbohydrates":14.45,"fiber":5.1,"sodium":5,"calcium":25,"vitamin_d":0,"magnesium":33,"vitamin_b6":0.17,"vitamin_b12":0,"vitamin_e":0.13,"zinc":1.24}'
    '{"name":"Mais","category":"Gemüse","base_unit":"g","base_size":100,"kcal":86,"iron":0.52,"sugar":3.22,"fat":1.35,"protein":3.27,"carbohydrates":18.7,"fiber":2.0,"sodium":15,"calcium":2,"vitamin_d":0,"magnesium":37,"vitamin_b6":0.09,"vitamin_b12":0,"vitamin_e":0.09,"zinc":0.46}'
    # --- Fleisch & Fisch ---
    '{"name":"Hähnchen (Brust)","category":"Fleisch","base_unit":"g","base_size":100,"kcal":165,"iron":1.0,"sugar":0,"fat":3.6,"protein":31.0,"carbohydrates":0,"fiber":0,"sodium":74,"calcium":11,"vitamin_d":0.1,"magnesium":29,"vitamin_b6":0.9,"vitamin_b12":0.3,"vitamin_e":0.25,"zinc":0.6}'
    '{"name":"Rindfleisch (mager)","category":"Fleisch","base_unit":"g","base_size":100,"kcal":143,"iron":2.6,"sugar":0,"fat":4.9,"protein":26.0,"carbohydrates":0,"fiber":0,"sodium":66,"calcium":11,"vitamin_d":0.1,"magnesium":26,"vitamin_b6":0.47,"vitamin_b12":2.5,"vitamin_e":0.12,"zinc":4.18}'
    '{"name":"Schweinefleisch (mager)","category":"Fleisch","base_unit":"g","base_size":100,"kcal":135,"iron":0.87,"sugar":0,"fat":4.7,"protein":22.3,"carbohydrates":0,"fiber":0,"sodium":58,"calcium":15,"vitamin_d":0.5,"magnesium":24,"vitamin_b6":0.76,"vitamin_b12":0.7,"vitamin_e":0.26,"zinc":1.7}'
    '{"name":"Lachs","category":"Fisch","base_unit":"g","base_size":100,"kcal":208,"iron":0.8,"sugar":0,"fat":13.42,"protein":20.42,"carbohydrates":0,"fiber":0,"sodium":59,"calcium":12,"vitamin_d":10.3,"magnesium":29,"vitamin_b6":0.86,"vitamin_b12":3.18,"vitamin_e":0.78,"zinc":0.64}'
    '{"name":"Thunfisch (Dose)","category":"Fisch","base_unit":"g","base_size":100,"kcal":109,"iron":1.3,"sugar":0,"fat":2.5,"protein":25.5,"carbohydrates":0,"fiber":0,"sodium":310,"calcium":11,"vitamin_d":3.7,"magnesium":34,"vitamin_b6":0.45,"vitamin_b12":2.52,"vitamin_e":0.49,"zinc":0.55}'
    '{"name":"Garnelen","category":"Fisch","base_unit":"g","base_size":100,"kcal":99,"iron":2.41,"sugar":0,"fat":0.3,"protein":24.0,"carbohydrates":0.91,"fiber":0,"sodium":111,"calcium":70,"vitamin_d":0,"magnesium":37,"vitamin_b6":0.2,"vitamin_b12":1.3,"vitamin_e":2.2,"zinc":1.34}'
    '{"name":"Truthahn (Brust)","category":"Fleisch","base_unit":"g","base_size":100,"kcal":135,"iron":1.4,"sugar":0,"fat":1.0,"protein":29.0,"carbohydrates":0,"fiber":0,"sodium":70,"calcium":14,"vitamin_d":0.1,"magnesium":28,"vitamin_b6":1.0,"vitamin_b12":0.4,"vitamin_e":0.15,"zinc":1.4}'
    # --- Milchprodukte ---
    '{"name":"Joghurt (natur, 3,5%)","category":"Milchprodukte","base_unit":"ml","base_size":100,"kcal":61,"iron":0.04,"sugar":4.7,"fat":3.5,"protein":3.5,"carbohydrates":4.7,"fiber":0,"sodium":46,"calcium":121,"vitamin_d":0.04,"magnesium":12,"vitamin_b6":0.05,"vitamin_b12":0.4,"vitamin_e":0.01,"zinc":0.6}'
    '{"name":"Milch (3,5%)","category":"Milchprodukte","base_unit":"ml","base_size":100,"kcal":64,"iron":0.04,"sugar":4.8,"fat":3.5,"protein":3.4,"carbohydrates":4.8,"fiber":0,"sodium":43,"calcium":120,"vitamin_d":0.08,"magnesium":11,"vitamin_b6":0.05,"vitamin_b12":0.5,"vitamin_e":0.07,"zinc":0.38}'
    '{"name":"Käse (Gouda)","category":"Milchprodukte","base_unit":"g","base_size":100,"kcal":356,"iron":0.24,"sugar":0.1,"fat":27.0,"protein":25.0,"carbohydrates":0.1,"fiber":0,"sodium":819,"calcium":740,"vitamin_d":0.6,"magnesium":29,"vitamin_b6":0.1,"vitamin_b12":1.5,"vitamin_e":0.19,"zinc":3.9}'
    '{"name":"Magerquark","category":"Milchprodukte","base_unit":"g","base_size":100,"kcal":67,"iron":0.05,"sugar":2.7,"fat":0.2,"protein":12.0,"carbohydrates":2.9,"fiber":0,"sodium":42,"calcium":73,"vitamin_d":0,"magnesium":10,"vitamin_b6":0.03,"vitamin_b12":0.6,"vitamin_e":0.01,"zinc":0.65}'
    '{"name":"Sahne (süß)","category":"Milchprodukte","base_unit":"ml","base_size":100,"kcal":345,"iron":0.03,"sugar":2.7,"fat":36.0,"protein":2.1,"carbohydrates":2.7,"fiber":0,"sodium":38,"calcium":68,"vitamin_d":0.06,"magnesium":7,"vitamin_b6":0.02,"vitamin_b12":0.1,"vitamin_e":0.49,"zinc":0.22}'
    '{"name":"Butter","category":"Milchprodukte","base_unit":"g","base_size":100,"kcal":717,"iron":0.02,"sugar":0.01,"fat":81.11,"protein":0.85,"carbohydrates":0.01,"fiber":0,"sodium":643,"calcium":24,"vitamin_d":1.5,"magnesium":2,"vitamin_b6":0.003,"vitamin_b12":0.13,"vitamin_e":2.32,"zinc":0.09}'
    '{"name":"Mozzarella","category":"Milchprodukte","base_unit":"g","base_size":100,"kcal":280,"iron":0.44,"sugar":0.5,"fat":17.0,"protein":28.0,"carbohydrates":3.1,"fiber":0,"sodium":627,"calcium":505,"vitamin_d":0,"magnesium":20,"vitamin_b6":0.05,"vitamin_b12":2.0,"vitamin_e":0.19,"zinc":2.92}'
    # --- Getreide ---
    '{"name":"Haferflocken","category":"Getreide","base_unit":"g","base_size":100,"kcal":389,"iron":4.72,"sugar":0.99,"fat":6.9,"protein":16.89,"carbohydrates":66.27,"fiber":10.6,"sodium":2,"calcium":54,"vitamin_d":0,"magnesium":177,"vitamin_b6":0.12,"vitamin_b12":0,"vitamin_e":1.04,"zinc":3.97}'
    '{"name":"Vollkornbrot","category":"Getreide","base_unit":"g","base_size":100,"kcal":247,"iron":2.74,"sugar":3.5,"fat":3.3,"protein":10.0,"carbohydrates":43.0,"fiber":6.8,"sodium":450,"calcium":73,"vitamin_d":0,"magnesium":73,"vitamin_b6":0.16,"vitamin_b12":0,"vitamin_e":0.38,"zinc":2.0}'
    '{"name":"Weißer Reis (gekocht)","category":"Getreide","base_unit":"g","base_size":100,"kcal":130,"iron":0.2,"sugar":0,"fat":0.3,"protein":2.7,"carbohydrates":28.2,"fiber":0.4,"sodium":1,"calcium":10,"vitamin_d":0,"magnesium":12,"vitamin_b6":0.05,"vitamin_b12":0,"vitamin_e":0.04,"zinc":0.49}'
    '{"name":"Brauner Reis (gekocht)","category":"Getreide","base_unit":"g","base_size":100,"kcal":111,"iron":0.56,"sugar":0,"fat":0.83,"protein":2.56,"carbohydrates":22.96,"fiber":1.8,"sodium":5,"calcium":10,"vitamin_d":0,"magnesium":43,"vitamin_b6":0.15,"vitamin_b12":0,"vitamin_e":0.19,"zinc":0.63}'
    '{"name":"Nudeln (Vollkorn, gekocht)","category":"Getreide","base_unit":"g","base_size":100,"kcal":124,"iron":1.3,"sugar":0.4,"fat":0.8,"protein":5.3,"carbohydrates":24.0,"fiber":3.5,"sodium":4,"calcium":15,"vitamin_d":0,"magnesium":43,"vitamin_b6":0.11,"vitamin_b12":0,"vitamin_e":0.35,"zinc":1.0}'
    '{"name":"Quinoa (gekocht)","category":"Getreide","base_unit":"g","base_size":100,"kcal":120,"iron":1.49,"sugar":0,"fat":1.92,"protein":4.4,"carbohydrates":21.3,"fiber":2.8,"sodium":7,"calcium":17,"vitamin_d":0,"magnesium":64,"vitamin_b6":0.12,"vitamin_b12":0,"vitamin_e":0.63,"zinc":1.09}'
    '{"name":"Couscous (gekocht)","category":"Getreide","base_unit":"g","base_size":100,"kcal":112,"iron":0.38,"sugar":0.1,"fat":0.16,"protein":3.79,"carbohydrates":23.22,"fiber":1.4,"sodium":5,"calcium":8,"vitamin_d":0,"magnesium":8,"vitamin_b6":0.08,"vitamin_b12":0,"vitamin_e":0.13,"zinc":0.26}'
    # --- Hülsenfrüchte ---
    '{"name":"Linsen (gekocht)","category":"Hülsenfrüchte","base_unit":"g","base_size":100,"kcal":116,"iron":3.33,"sugar":1.8,"fat":0.38,"protein":9.02,"carbohydrates":20.13,"fiber":7.9,"sodium":2,"calcium":19,"vitamin_d":0,"magnesium":36,"vitamin_b6":0.18,"vitamin_b12":0,"vitamin_e":0.11,"zinc":1.27}'
    '{"name":"Kichererbsen (gekocht)","category":"Hülsenfrüchte","base_unit":"g","base_size":100,"kcal":164,"iron":2.89,"sugar":2.81,"fat":2.59,"protein":8.86,"carbohydrates":27.42,"fiber":7.6,"sodium":7,"calcium":49,"vitamin_d":0,"magnesium":48,"vitamin_b6":0.14,"vitamin_b12":0,"vitamin_e":0.35,"zinc":1.53}'
    '{"name":"Kidneybohnen (gekocht)","category":"Hülsenfrüchte","base_unit":"g","base_size":100,"kcal":127,"iron":2.94,"sugar":0.3,"fat":0.5,"protein":8.67,"carbohydrates":22.8,"fiber":7.4,"sodium":2,"calcium":28,"vitamin_d":0,"magnesium":45,"vitamin_b6":0.27,"vitamin_b12":0,"vitamin_e":0.03,"zinc":1.07}'
    '{"name":"Schwarze Bohnen (gekocht)","category":"Hülsenfrüchte","base_unit":"g","base_size":100,"kcal":132,"iron":2.1,"sugar":0.32,"fat":0.54,"protein":8.86,"carbohydrates":23.71,"fiber":8.7,"sodium":1,"calcium":27,"vitamin_d":0,"magnesium":70,"vitamin_b6":0.07,"vitamin_b12":0,"vitamin_e":0.03,"zinc":1.12}'
    '{"name":"Edamame (gekocht)","category":"Hülsenfrüchte","base_unit":"g","base_size":100,"kcal":121,"iron":2.27,"sugar":2.18,"fat":5.2,"protein":11.91,"carbohydrates":8.91,"fiber":5.2,"sodium":4,"calcium":63,"vitamin_d":0,"magnesium":64,"vitamin_b6":0.1,"vitamin_b12":0,"vitamin_e":0.68,"zinc":1.37}'
    '{"name":"Tofu (fest)","category":"Hülsenfrüchte","base_unit":"g","base_size":100,"kcal":76,"iron":1.61,"sugar":0.62,"fat":4.8,"protein":8.08,"carbohydrates":1.87,"fiber":0.3,"sodium":7,"calcium":350,"vitamin_d":0,"magnesium":30,"vitamin_b6":0.07,"vitamin_b12":0,"vitamin_e":0.04,"zinc":0.8}'
    # --- Nüsse & Samen ---
    '{"name":"Mandeln","category":"Nüsse & Samen","base_unit":"g","base_size":100,"kcal":579,"iron":3.71,"sugar":4.43,"fat":49.93,"protein":21.15,"carbohydrates":21.55,"fiber":12.5,"sodium":1,"calcium":264,"vitamin_d":0,"magnesium":270,"vitamin_b6":0.14,"vitamin_b12":0,"vitamin_e":25.63,"zinc":3.08}'
    '{"name":"Walnüsse","category":"Nüsse & Samen","base_unit":"g","base_size":100,"kcal":654,"iron":2.91,"sugar":2.61,"fat":65.21,"protein":15.23,"carbohydrates":13.71,"fiber":6.7,"sodium":2,"calcium":98,"vitamin_d":0,"magnesium":158,"vitamin_b6":0.54,"vitamin_b12":0,"vitamin_e":0.7,"zinc":3.09}'
    '{"name":"Chiasamen","category":"Nüsse & Samen","base_unit":"g","base_size":100,"kcal":486,"iron":7.72,"sugar":0,"fat":30.74,"protein":16.54,"carbohydrates":42.12,"fiber":34.4,"sodium":16,"calcium":631,"vitamin_d":0,"magnesium":335,"vitamin_b6":0.18,"vitamin_b12":0,"vitamin_e":0.5,"zinc":4.58}'
    '{"name":"Leinsamen","category":"Nüsse & Samen","base_unit":"g","base_size":100,"kcal":534,"iron":5.73,"sugar":1.55,"fat":42.16,"protein":18.29,"carbohydrates":28.88,"fiber":27.3,"sodium":30,"calcium":255,"vitamin_d":0,"magnesium":392,"vitamin_b6":0.47,"vitamin_b12":0,"vitamin_e":0.31,"zinc":4.34}'
    '{"name":"Sonnenblumenkerne","category":"Nüsse & Samen","base_unit":"g","base_size":100,"kcal":584,"iron":5.25,"sugar":2.62,"fat":51.46,"protein":20.78,"carbohydrates":20.0,"fiber":8.6,"sodium":9,"calcium":78,"vitamin_d":0,"magnesium":325,"vitamin_b6":1.35,"vitamin_b12":0,"vitamin_e":35.17,"zinc":5.0}'
    '{"name":"Kürbiskerne","category":"Nüsse & Samen","base_unit":"g","base_size":100,"kcal":559,"iron":8.82,"sugar":1.4,"fat":49.05,"protein":30.23,"carbohydrates":10.71,"fiber":6.0,"sodium":7,"calcium":46,"vitamin_d":0,"magnesium":592,"vitamin_b6":0.22,"vitamin_b12":0,"vitamin_e":2.18,"zinc":7.81}'
    '{"name":"Erdnüsse","category":"Nüsse & Samen","base_unit":"g","base_size":100,"kcal":567,"iron":4.58,"sugar":3.97,"fat":49.24,"protein":25.8,"carbohydrates":16.13,"fiber":8.5,"sodium":18,"calcium":92,"vitamin_d":0,"magnesium":168,"vitamin_b6":0.35,"vitamin_b12":0,"vitamin_e":8.33,"zinc":3.27}'
    '{"name":"Cashewkerne","category":"Nüsse & Samen","base_unit":"g","base_size":100,"kcal":553,"iron":6.68,"sugar":5.91,"fat":43.85,"protein":18.22,"carbohydrates":30.19,"fiber":3.3,"sodium":12,"calcium":37,"vitamin_d":0,"magnesium":292,"vitamin_b6":0.42,"vitamin_b12":0,"vitamin_e":0.9,"zinc":5.78}'
    # --- Öle & Fette ---
    '{"name":"Olivenöl","category":"Öle & Fette","base_unit":"ml","base_size":100,"kcal":884,"iron":0.56,"sugar":0,"fat":100.0,"protein":0,"carbohydrates":0,"fiber":0,"sodium":2,"calcium":1,"vitamin_d":0,"magnesium":0,"vitamin_b6":0,"vitamin_b12":0,"vitamin_e":14.35,"zinc":0}'
    '{"name":"Rapsöl","category":"Öle & Fette","base_unit":"ml","base_size":100,"kcal":884,"iron":0,"sugar":0,"fat":100.0,"protein":0,"carbohydrates":0,"fiber":0,"sodium":0,"calcium":0,"vitamin_d":0,"magnesium":0,"vitamin_b6":0,"vitamin_b12":0,"vitamin_e":17.46,"zinc":0}'
    '{"name":"Kokosöl","category":"Öle & Fette","base_unit":"ml","base_size":100,"kcal":892,"iron":0.05,"sugar":0,"fat":99.06,"protein":0,"carbohydrates":0,"fiber":0,"sodium":0,"calcium":0,"vitamin_d":0,"magnesium":0,"vitamin_b6":0,"vitamin_b12":0,"vitamin_e":0.11,"zinc":0}'
    # --- Sonstiges ---
    '{"name":"Ei (Hühnerei)","category":"Sonstiges","base_unit":"g","base_size":100,"kcal":155,"iron":1.75,"sugar":0.37,"fat":10.61,"protein":12.56,"carbohydrates":1.12,"fiber":0,"sodium":124,"calcium":56,"vitamin_d":2.0,"magnesium":10,"vitamin_b6":0.17,"vitamin_b12":1.11,"vitamin_e":1.05,"zinc":1.29}'
    '{"name":"Honig","category":"Sonstiges","base_unit":"g","base_size":100,"kcal":304,"iron":0.42,"sugar":82.12,"fat":0,"protein":0.3,"carbohydrates":82.4,"fiber":0.2,"sodium":4,"calcium":6,"vitamin_d":0,"magnesium":2,"vitamin_b6":0.02,"vitamin_b12":0,"vitamin_e":0,"zinc":0.22}'
    '{"name":"Dunkle Schokolade (70%)","category":"Sonstiges","base_unit":"g","base_size":100,"kcal":598,"iron":11.9,"sugar":24.23,"fat":42.63,"protein":7.79,"carbohydrates":45.9,"fiber":10.9,"sodium":20,"calcium":73,"vitamin_d":0,"magnesium":228,"vitamin_b6":0.04,"vitamin_b12":0,"vitamin_e":0.59,"zinc":3.31}'
    '{"name":"Hafermilch","category":"Sonstiges","base_unit":"ml","base_size":100,"kcal":42,"iron":0.2,"sugar":4.0,"fat":1.5,"protein":1.0,"carbohydrates":6.5,"fiber":0.8,"sodium":60,"calcium":120,"vitamin_d":1.5,"magnesium":10,"vitamin_b6":0.05,"vitamin_b12":0,"vitamin_e":0.5,"zinc":0.1}'
    '{"name":"Sojadrink (ungesüßt)","category":"Sonstiges","base_unit":"ml","base_size":100,"kcal":33,"iron":0.49,"sugar":0.5,"fat":1.8,"protein":3.3,"carbohydrates":1.7,"fiber":0.6,"sodium":51,"calcium":120,"vitamin_d":1.0,"magnesium":20,"vitamin_b6":0.06,"vitamin_b12":0.38,"vitamin_e":0.5,"zinc":0.32}'
)

# Seed each ingredient
TOTAL=${#INGREDIENTS[@]}
SUCCESS=0
FAILED=0
SKIPPED=0

for i in "${!INGREDIENTS[@]}"; do
    INGREDIENT="${INGREDIENTS[$i]}"

    RESPONSE=$(curl -s -k -L -b "$COOKIES_FILE" -X POST "$API_URL/api/ingredients-master" \
        -H "Content-Type: application/json" \
        -d "$INGREDIENT")

    if echo "$RESPONSE" | grep -q '"id"'; then
        SUCCESS=$((SUCCESS + 1))
        echo -n "."
    elif echo "$RESPONSE" | grep -qi "already exists\|conflict\|duplicate"; then
        SKIPPED=$((SKIPPED + 1))
        echo -n "s"
    else
        FAILED=$((FAILED + 1))
        if [ $FAILED -eq 1 ]; then
            echo ""
            echo "    First failure response: $RESPONSE"
            echo -n "    "
        fi
        echo -n "x"
    fi
done

echo ""
echo ""
echo "========================================="
echo "✓ Seeding Complete!"
echo "========================================="
echo "Results:"
echo "  ✓ Created: $SUCCESS"
if [ $SKIPPED -gt 0 ]; then
    echo "  ↩ Already existed (skipped): $SKIPPED"
fi
if [ $FAILED -gt 0 ]; then
    echo "  ✗ Failed: $FAILED"
fi
echo "  Total: $TOTAL ingredients"
echo ""
echo "You can now:"
echo "  - Login with: $SEED_USER_EMAIL / $SEED_USER_PASSWORD"
echo "  - View ingredients at: /ingredients"
echo "  - Create recipes at: /recipes/new"
echo ""
echo "========================================="
