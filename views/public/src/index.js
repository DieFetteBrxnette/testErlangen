console.log(reviews)
reviews.forEach((review) => {
    const card = `
        <div class="col-sm-6 col-md-4 col-lg-3">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${review.title}</h5>
                    <p class="card-text">${review.body}</p>
                    <!-- Add more fields as needed -->
                </div>
            </div>
        </div>
    `;

    document.getElementById('reviews').innerHTML += card;
});