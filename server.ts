import express from 'express';
import path from 'path';
import { insertReviewIntoTable, dBStartUp, insertCityIntoTable, getAllReviewsFromTable, getAllCitiesFromTable, getReviewFromTable, getCityFromTable } from './databaseHelper';
import { generateCityFromBody, generateReviewFromBody } from './Review';
import { pathToFileURL } from 'url';

const app = express();
let isLocal = false;

if (pathToFileURL(__dirname).toString().includes("C:")) {
    isLocal = true;
}
const pathAddition = isLocal ? "" : "/reviews";

dBStartUp();

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Set the static directory
app.use(express.static('views/public'));

// Set the body parser
app.use(express.json());

// Route for the home page
app.get(pathAddition + '/', async (req, res) => {
    getAllReviewsFromTable().then((reviews) => {
        res.status(200).render('index', { reviews: reviews });
    });
});

// Route for submitting a new entry to the database
app.get(pathAddition + '/new', (req, res) => {
    getAllCitiesFromTable().then((cities) => {
        res.status(200).render('new', { cities: cities });
    });
});

// Route for individual reviews
app.get(pathAddition + '/review/:id', async (req, res) => {
    getReviewFromTable(req.params.id).then((review) => {
        if (review) {
            res.status(200).render('details', { review: review });
        } else {
            res.status(404).send('Review not found');
        }
    });
});

app.get(pathAddition + '/cities', (req, res) => {
    getAllCitiesFromTable().then((cities) => {
        res.status(200).send(JSON.stringify(cities));
    });
});

// Route for submitting a new review entry to the database
app.post('/review', async (req, res) => {
    try {
        const review = generateReviewFromBody(req.body);
    
        if (!review) {
            console.log("Invalid input")
            res.status(422).json({ message: "Invalid input, couldn't generate an object from provided data" });
            return;
        }
        
        const id = await insertReviewIntoTable(review);
    
        if (id === -1) {
            res.status(500).json({ message: 'Error inserting review into database' });
            return;
        }
    
        res.status(200).json({ redirect: pathAddition + `/review/${id}` });
    } catch (err) {
        console.log("Error inserting review into database")
        res.status(500).json({ message: 'Error inserting review into database' });
    }
});

// Route for submitting a new city entry to the database
app.post('/city', async (req, res) => {
    try {
        const city = generateCityFromBody(req.body);
    
        if (!city) {
            console.log("Invalid input")
            res.status(422).json({ message: 'Invalid input' });
            return;
        }
    
        const previousId = await getCityFromTable(city.zip); 
        console.log(previousId);
        if (previousId) {
            res.status(409).json({ message: 'City already exists' });
            return;
        }

        const id = await insertCityIntoTable(city);
    
        if (id === -1) {
            res.status(500).json({ message: 'Error inserting city into database' });
            return;
        }
  
        res.status(200).json(city);
    } catch (err) {
        console.log("Error inserting city into database")
        res.status(500).json({ message: 'Error inserting city into database' });
    }
});
// Start the server
app.listen(3003, () => console.log('Server started'));