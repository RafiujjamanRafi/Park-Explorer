const apiKey = '6640GbLsDhyQ9r6TbMSrNYH0zztmN3PrhPYxKObn'; // Replace with your real NPS API key

const stateSelect = document.getElementById('stateSelect');
const activitySelect = document.getElementById('activitySelect');
const resultsContainer = document.getElementById('results');
const summary = document.getElementById('summary');
const paginationContainer = document.getElementById('pagination');

let allParks = [];
let currentPage = 1;
const parksPerPage = 12;

// U.S. states
const states = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming"
};

// Load state options
Object.entries(states).forEach(([code, name]) => {
  const option = document.createElement('option');
  option.value = code;
  option.textContent = name;
  stateSelect.appendChild(option);
});

// Load activities
fetch(`https://developer.nps.gov/api/v1/activities?api_key=${apiKey}`)
  .then(res => res.json())
  .then(data => {
    data.data.forEach(activity => {
      const option = document.createElement('option');
      option.value = activity.id;
      option.textContent = activity.name;
      activitySelect.appendChild(option);
    });
  });

// Event listeners
[stateSelect, activitySelect].forEach(select => {
  select.addEventListener('change', fetchParks);
});

// Fetch parks with pagination
async function fetchParks() {
  const state = stateSelect.value;
  const activity = activitySelect.value;
  resultsContainer.innerHTML = 'Loading parks...';
  summary.textContent = '';
  paginationContainer.innerHTML = '';

  allParks = [];
  currentPage = 1;
  let start = 0;
  const limit = 100;
  let total = 0;

  do {
    const url = `https://developer.nps.gov/api/v1/parks?stateCode=${state}&limit=${limit}&start=${start}&api_key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    total = parseInt(data.total);
    allParks = allParks.concat(data.data);
    start += limit;
  } while (start < total);

  if (activity) {
    allParks = allParks.filter(p =>
      p.activities.some(a => a.id === activity)
    );
  }

  displayParks(allParks);
  renderPagination();
}

function displayParks(parks) {
  resultsContainer.innerHTML = '';

  const stateName = states[stateSelect.value] || '';
  const activityText = activitySelect.options[activitySelect.selectedIndex]?.text || '';
  const count = parks.length;

  const stateSelected = !!stateSelect.value;
  const activitySelected = !!activitySelect.value;

  let summaryText = '';
  if (stateSelected && activitySelected) {
    summaryText = `${count} Parks for ${activityText} in ${stateName}`;
  } else if (stateSelected) {
    summaryText = `${count} Parks in ${stateName}`;
  } else if (activitySelected) {
    summaryText = `${count} Parks for ${activityText}`;
  } else {
    summaryText = `All ${count} Parks`;
  }

  summary.textContent = summaryText;

  if (!count) {
    resultsContainer.innerHTML = '<p>No parks found matching your criteria.</p>';
    return;
  }

  const startIndex = (currentPage - 1) * parksPerPage;
  const endIndex = startIndex + parksPerPage;
  const parksToShow = parks.slice(startIndex, endIndex);

  parksToShow.forEach(park => {
    const card = document.createElement('div');
    card.className = 'park-card';

    const image = park.images.length ? park.images[0].url : 'https://via.placeholder.com/400x200?text=No+Image';
    const desc = park.description.length > 150 ? park.description.slice(0, 150) + '...' : park.description;

    card.innerHTML = `
      <img src="${image}" alt="${park.fullName}" />
      <div class="park-content">
        <h2>${park.fullName}</h2>
        <p>${desc}</p>
        <a href="${park.url}" target="_blank">Learn More</a>
      </div>
    `;

    resultsContainer.appendChild(card);
  });
}

// Render pagination buttons
function renderPagination() {
  paginationContainer.innerHTML = '';
  const totalPages = Math.ceil(allParks.length / parksPerPage);
  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = (i === currentPage) ? 'active' : '';
    btn.addEventListener('click', () => {
      currentPage = i;
      displayParks(allParks);
      renderPagination();
    });
    paginationContainer.appendChild(btn);
  }
}
