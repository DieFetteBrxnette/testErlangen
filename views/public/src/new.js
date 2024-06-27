const rowCount = 6;
const ratings = Array(rowCount).fill(0);
const lastRating = Array(rowCount).fill(-1);
const ratingGroups = document.querySelectorAll('.stars');

ratingGroups.forEach((group, groupIndex) => {
	const stars = getStars(group);
	stars.forEach(star => {
		star.addEventListener('mouseover', function() {
		const index = parseInt(this.dataset.index);
			stars.forEach((star, i) => {
				star.classList.remove('fa-star', 'fa-star-o', 'fa-star-half-o');

				// Removal of half a star from a whole star
			  	if (i === (ratings[groupIndex] - 1) && i === index && ratings[groupIndex] % 1 === 0) {
					star.style.color = 'gray';
					star.classList.add('fa-star-half-o');
				// Removal of half a star from a half star
				} else if (i === (ratings[groupIndex] - 0.5) && i === index && ratings[groupIndex] % 1 !== 0) {
					star.style.color = 'gray';
					star.classList.add('fa-star');
				// Display star outline, when rating is hovered, but not selected
				} else if (i <= index && i >= ratings[groupIndex]) {
					star.style.color = 'gold';
					star.classList.add('fa-star-o');
				// Display whole star outline, when rating is hovered, but not selected for half star
				} else if (i <= index && ratings[groupIndex] % 1 !== 0 && i == ratings[groupIndex] - 0.5) {
					star.style.color = 'gold';
					star.classList.add('fa-star-o');
				// Display whole star (selected)
				} else if (i <= index && i < ratings[groupIndex]) {
					star.style.color = 'gold';
					star.classList.add('fa-star');
				// Display half star (selected)
				} else if (i <= index && i >= ratings[groupIndex] && ratings[groupIndex] % 1 !== 0) {
					star.style.color = 'gold';
					star.classList.add('fa-star-half-o');
				// Display Removal of whole star
				} else if (i < ratings[groupIndex]) {
					star.style.color = 'gray';
					star.classList.add('fa-star');
				// Display empty star (selected)
				} else {
					star.style.color = 'gray';
					star.classList.add('fa-star-o');
				}
			});
		});

		star.addEventListener('click', function() {
			let index = parseInt(this.dataset.index);
			// Reduce rating by half a star, if the same full star is clicked twice
			if (lastRating[groupIndex] === index && ratings[groupIndex] === index + 1) {
				ratings[groupIndex] = index + 0.5;
			// Reduce rating by half a star, if the same half star is clicked twice
			} else if (lastRating[groupIndex] === index && ratings[groupIndex] === index + 0.5) {
				ratings[groupIndex] = index;
				index -= 1;
			// Increase rating by index + 1 for the selected star
			} else {
				ratings[groupIndex] = index + 1;
			}
			lastRating[groupIndex] = index;
			group.querySelector('.rating').value = ratings[groupIndex];
			updateStars(group, ratings[groupIndex]);
			updateTotalAndMedian();
		});
	});
	group.addEventListener('mouseout', function() {
		updateStars(group, ratings[groupIndex]);
	});
});

// Update stars based on rating
function updateStars(group, rating) {
	const stars = getStars(group);
	stars.forEach((star, i) => {
		star.classList.remove('fa-star', 'fa-star-o', 'fa-star-half-o');
		// Display whole star if rating is a whole number
		if (i < Math.floor(rating)) {
			star.style.color = 'gold';
			star.classList.add('fa-star');
		// Display half star if rating is not a whole number
		} else if (i < rating) {
			star.style.color = 'gold';
			star.classList.add('fa-star-half-o');
		// Display empty star
		} else {
			star.style.color = 'gray';
			star.classList.add('fa-star-o');
		}
	});
}

function getStars(group) {
  	const stars = group.querySelectorAll('.fa-star, .fa-star-o, .fa-star-half-o');
	return stars;
}

function updateTotalAndMedian() {
	const total = ratings.reduce((a, b) => a + b, 0) * 2;
	const median = Math.round(total / ratings.length * 100) / 100;
	document.getElementById('total').textContent = total;
	document.getElementById('median').textContent = median;
}

let currentCard = 1;
const totalCards = 2;

document.getElementById('prevCard').addEventListener('click', () => {
  if (currentCard > 1) {
    document.getElementById(`card${currentCard}`).classList.add('hidden');
    currentCard--;
    document.getElementById(`card${currentCard}`).classList.remove('hidden');
  }
});

document.getElementById('nextCard').addEventListener('click', () => {
  if (currentCard < totalCards) {
    document.getElementById(`card${currentCard}`).classList.add('hidden');
    currentCard++;
    document.getElementById(`card${currentCard}`).classList.remove('hidden');
  }
});
document.getElementById('newReviewForm').addEventListener('submit', function(event) {
	event.preventDefault();

	// Extract form-group values
	const storeName = document.getElementById('review-name').value;
	const street = document.getElementById('review-street').value;
	const houseNumber = document.getElementById('review-number').value;
	const zipCode = document.getElementById('review-zip').value;
	const reasoning = document.getElementById('review-body').value;
	const mapsLink = document.getElementById('review-maps').value ? document.getElementById('review-maps').value : 'https://www.google.com/maps/search/?api=1&query=' + street + '+' + houseNumber + '+' + zipCode;
	let price = document.getElementById('review-price').value;

	// Extract star ratings
	const taste = ratings[0];
	const sauce = ratings[1];
	const ingredients = ratings[2];
	const presentation = ratings[3];
	const value = ratings[4];
	const ambiance = ratings[5];
	
	if (storeName === '' || street === '' || houseNumber === '' || zipCode === '' || reasoning === '' || price === '') {
		alert('Please fill in all fields');
		return;
	}

	price.replace('€', '');
	price.replace('$', '');

	if (parseInt(price) == NaN || parseInt(price) < 0) {
		alert('Invalid price');
		return;
	}

	let zipValid = false;

	for (let i = 0; i < cities.length; i++) {
		if (cities[i].zip == zipCode) {
			zipValid = true;
			break;
		}
	}

	if (!zipValid) {
		alert('Invalid zip code');
		return;
	}

	const review = {
		taste: taste,
		sauce: sauce,
		ingredients: ingredients,
		presentation: presentation,
		value: value,
		ambiance: ambiance,
		title: storeName,
		street: street,
		number: houseNumber,
		zip: zipCode,
		mapsLink: mapsLink,
		body: reasoning,
		price: price,
		img: 'https://via.placeholder.com/150',
	};
	  
	fetch('/review', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
	},
	body: JSON.stringify(review),
	})
		.then(response => response.json())
		.then(data => {
			if (data.redirect) {
			  	window.location.href = data.redirect;
			}
		})
		.catch((error) => {
		console.error('Error:', error);
	});
});
  
document.getElementById('newCityForm').addEventListener('submit', function(event) {
	event.preventDefault();
	const city = {
		zip: document.getElementById('city-zip').value,
		name: document.getElementById('city-name').value,
		country: document.getElementById('city-country').value,
	};

	if (city.zip === '' || city.name === '' || city.country === '') {
		alert('Please fill in all fields');
		return;
	}
	  
	fetch('/city', {
		method: 'POST',
		headers: {
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify(city)
	})
	.then(response => {
		if (!response.ok) {
			throw response;
		}
		return response.json();
	})	
	.then(data => {
		cities.push(data);
		alert(`City ${data.name} added`);
	})
	.catch(error => {	
		if (error instanceof Response) {
			switch (error.status) {
				case 400:
					console.error('Bad Request');
					break;
				case 401:
					console.error('Unauthorized');
					break;
				case 409:
					alert('City already exists');
					break;
				case 500:
					console.error('Internal Server Error');
					break;
				default:
					console.error('Unknown error');
			}
		} else {
		  	console.error('Error:', error);
		}
	});
});