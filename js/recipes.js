// js/recipes.js

const grid = document.getElementById('recipeGrid');
const search = document.getElementById('recipeSearch');
const catFilter = document.getElementById('categoryFilter');
const modal = document.getElementById('recipeModal');
const closeModal = document.getElementById('closeModal');
let recipes = [];

async function loadData(){
  try {
    const res = await fetch('data/recipes.json');
    recipes = await res.json();
    populateCategories();
    render(recipes);
  } catch (error) {
    console.error('Error loading recipes:', error);
    showToast('Error loading recipes. Please try again later.', 'error');
  }
}

function populateCategories(){
  const cats = Array.from(new Set(recipes.map(r=>r.category)));
  cats.forEach(c=>{
    const opt = document.createElement('option'); opt.value=c; opt.textContent=c; catFilter.appendChild(opt);
  });
}

function render(list){
  grid.innerHTML = '';
  list.forEach(r=>{
    const card = document.createElement('article'); 
    card.className='recipe-card';
    card.innerHTML = `
      <div class="recipe-image">
        <img src="${r.image}" alt="${r.title}" loading="lazy">
        <div class="recipe-category">${r.category}</div>
      </div>
      <div class="recipe-content">
        <h3>${r.title}</h3>
        <p class="recipe-description">${r.description}</p>
        <div class="recipe-nutrition">
          <span class="nutrition-item">🔥 ${r.nutrition.calories} cal</span>
          <span class="nutrition-item">💪 ${r.nutrition.protein}g protein</span>
        </div>
        <button data-id="${r.id}" class="viewBtn">View Recipe</button>
      </div>
    `;
    grid.appendChild(card);
  });
}
grid.addEventListener('click', e=>{
  const btn = e.target.closest('.viewBtn'); if(!btn) return;
  const id = btn.dataset.id; openModal(recipes.find(x=>x.id===id));
});
search.addEventListener('input', ()=> applyFilters());
catFilter.addEventListener('change', ()=> applyFilters());
function applyFilters(){
  const q = search.value.trim().toLowerCase();
  const cat = catFilter.value;
  const filtered = recipes.filter(r => (r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)) && (cat? r.category===cat: true));
  render(filtered);
}
function openModal(r){
  document.getElementById('modalTitle').textContent = r.title;
  document.getElementById('modalImg').src = r.image; document.getElementById('modalImg').alt = r.title;
  const ing = document.getElementById('modalIngredients'); ing.innerHTML = ''; r.ingredients.forEach(i=>{ const li=document.createElement('li'); li.textContent=i; ing.appendChild(li);});
  const steps = document.getElementById('modalSteps'); steps.innerHTML=''; r.steps.forEach(s=>{ const li=document.createElement('li'); li.textContent=s; steps.appendChild(li);});
  const nut = document.getElementById('modalNutrition'); nut.innerHTML='';
  nut.innerHTML = `<tr><th>Calories</th><td>${r.nutrition.calories}</td></tr><tr><th>Protein</th><td>${r.nutrition.protein}g</td></tr><tr><th>Carbs</th><td>${r.nutrition.carbs}g</td></tr><tr><th>Fat</th><td>${r.nutrition.fat}g</td></tr>`;
  modal.classList.add('show'); 
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
  document.getElementById('saveRecipe').onclick = ()=> {
    const saved = JSON.parse(localStorage.getItem('gb_saved_recipes')||'[]');
    if(!saved.includes(r.id)){ saved.push(r.id); localStorage.setItem('gb_saved_recipes', JSON.stringify(saved)); showToast('Recipe saved','success'); }
    else showToast('Already saved','info');
  };
}
closeModal.onclick = ()=> { 
  modal.classList.remove('show'); 
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow = ''; // Restore scrolling
};
window.addEventListener('click', e => { 
  if(e.target===modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
});

loadData();
