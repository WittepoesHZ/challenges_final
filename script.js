async function fetchRandomCocktail() {
  const res = await fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php');
  const data = await res.json();
  displayCocktails([data.drinks[0]]);
}

async function searchCocktail() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;

  const res = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${query}`);
  const data = await res.json();
  if (data.drinks) {
    displayCocktails(data.drinks);
  } else {
    document.getElementById('cocktailContainer').innerHTML = '<p>No cocktail found.</p>';
  }
}

async function loadInitialData() {
  const [randomRes, ingredientsRes] = await Promise.all([
    fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php'),
    fetch('https://www.thecocktaildb.com/api/json/v1/1/list.php?i=list')
  ]);
  const randomData = await randomRes.json();
  const ingredientsData = await ingredientsRes.json();
  displayCocktails([randomData.drinks[0]]);
  console.log('Ingredients fetched:', ingredientsData.drinks.length);
}

function displayCocktails(drinks) {
  document.getElementById('cocktailContainer').innerHTML = drinks.map(drink => {
    const ingredients = [];
    for (let i = 1; i <= 15; i++) {
      const ingredient = drink[`strIngredient${i}`];
      const measure = drink[`strMeasure${i}`];
      if (ingredient) {
        ingredients.push(`${measure || ''} ${ingredient}`.trim());
      }
    }

    return `
      <section class="bg-white text-black rounded-lg p-4 shadow-md">
        <h2 class="text-xl font-bold mb-2">${drink.strDrink}</h2>
        <img src="${drink.strDrinkThumb}" alt="${drink.strDrink}" class="w-full rounded mb-4">
        <h3 class="font-semibold">Ingredients:</h3>
        <ul class="list-disc list-inside mb-4">
          ${ingredients.map(i => `<li>${i}</li>`).join('')}
        </ul>
        <h3 class="font-semibold">Instructions:</h3>
        <p>${drink.strInstructions}</p>
      </section>
    `;
  }).join('');
}

async function searchByIngredient() {
  const container = document.getElementById('cocktailContainer');
  const ingredient = document.getElementById('ingredientInput')?.value.trim();
  if (!ingredient) {
    container.innerHTML = '<p>Please enter an ingredient to search.</p>';
    return;
  }

  container.innerHTML = '<p>Loading...</p>';

  try {
    const res = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`);
    if (!res.ok) throw new Error('Failed to fetch data');

    const data = await res.json();

    if (!data.drinks) {
      container.innerHTML = '<p>No cocktails found with that ingredient.</p>';
      return;
    }

    const detailedDrinks = await Promise.all(
      data.drinks.map(async drink => {
        const detailRes = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${drink.idDrink}`);
        if (!detailRes.ok) throw new Error('Failed to fetch cocktail details');
        const detailData = await detailRes.json();
        return detailData.drinks[0];
      })
    );

    displayCocktails(detailedDrinks);
  } catch (error) {
    container.innerHTML = `<p class="text-red-400">Error: ${error.message}. Please try again later.</p>`;
    console.error(error);
  }
}
