import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3'
import { Review, ReviewCity, ReviewLocation, ReviewRating, cities } from './Review';
import { JoinedReviewRow, ReviewCityRow } from './typescriptHelper';

const sql = sqlite3.verbose();

enum TABLES {
	REVIEWS = 'reviews',
	OTHER = 'other'
}

const dbPathMap = {
	[TABLES.REVIEWS]: './data/reviewdata.db',
	[TABLES.OTHER]: './data/otherdata.db'
};
const dbMap = new Map<TABLES, sqlite3.Database>();

// Start up the database & create tables if they don't exist
export function dBStartUp() {
	console.log('Starting up the database...');
	createDB(dbPathMap[TABLES.REVIEWS]);

	getAllCitiesFromTable().then((c) => {
		cities.push(...c);
	});

	// instant kill switch for the database
	clearReviewDB();
}

// Create a new database file and open a connection to it
function getDB(table: TABLES): sqlite3.Database {
	const dbPath = dbPathMap[table];
	const db = new sqlite3.Database(dbPath, (err) => {
		if (err) {
			console.error(err.message);
		} else {
			console.log('Connected to the SQLite database (' + dbPath + ').');
		}
	});
	return db;
}

// Create a new database file and open a connection to it
function createDB(pathStr: string): sqlite3.Database | undefined{
	const dir = path.dirname(pathStr);

	// Create the directory if it doesn't exist
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	const db = new sql.Database(pathStr, (err) => {
		if (err) {
			console.error(err.message);
			return undefined;
		}

		if (pathStr === dbPathMap[TABLES.REVIEWS]) {
			createReviewTable(db);
		}
		console.log('Connected to the SQLite database (' + path +').');
	});

	return db;
}

// Create a new table for the reviews
function createReviewTable(db: sqlite3.Database) {
	db.serialize(() => {
		db.run(`
			CREATE TABLE IF NOT EXISTS ReviewCity (
			zip PRIMARY KEY,
			name TEXT,
			country TEXT
			);
		`);
	
		db.run(`
			CREATE TABLE IF NOT EXISTS ReviewLocation (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			city_id INTEGER,
			street TEXT,
			number INTEGER,
			mapsLink TEXT,
			FOREIGN KEY(city_id) REFERENCES ReviewCity(id)
			);
		`);
	
		db.run(`
			CREATE TABLE IF NOT EXISTS ReviewRating (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			taste INTEGER,
			sauce INTEGER,
			ingredients INTEGER,
			presentation INTEGER,
			value INTEGER,
			ambiance INTEGER,
			total INTEGER
			);
		`);
	
		db.run(`
			CREATE TABLE IF NOT EXISTS Review (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT,
			body TEXT,
			rating_id INTEGER,
			location_id INTEGER,
			created_at TEXT,
			price INTEGER,
			img TEXT,
			FOREIGN KEY(rating_id) REFERENCES ReviewRating(id),
			FOREIGN KEY(location_id) REFERENCES ReviewLocation(id)
			);
		`, (err) => {
			if (err) {
				console.error(err.message);
			} else {
				console.log('Reviews table initialized.');
			}
		});
	});
  
	closeDB(db);
}

// read the data from the database and return a review object
export async function getReviewFromTable(id: string): Promise<Review | undefined> {
	const idNum = parseInt(id);

	if (isNaN(idNum)) {
		return undefined;
	}

	const db = getDB(TABLES.REVIEWS);

	try {
		// await the promise to get the review from the database
		const review = await new Promise<Review | undefined>((resolve, reject) => {
			// join the tables to get all the data for the review matching the id
			db.get(`
				SELECT Review.*, ReviewRating.*, ReviewLocation.*
				FROM Review
				INNER JOIN ReviewRating ON Review.rating_id = ReviewRating.id
				INNER JOIN ReviewLocation ON Review.location_id = ReviewLocation.id
				WHERE Review.id = ?
			`, [id], (err, row: JoinedReviewRow) => {
				if (err) {
					reject(err);
				} else if (row) {
					// create the review object from the data
					const city = new ReviewCity(row.zip, row.city_name, row.country);
					const rating = new ReviewRating(row.taste, row.sauce, row.ingredients, row.presentation, row.value, row.ambiance);
					const location = new ReviewLocation(city, row.street, row.number, row.mapsLink);
					const review = new Review(row.title, row.body, rating, location, row.created_at, row.img, row.price);
					review.assignId(row.id);
					resolve(review);
				} else {
					resolve(undefined);
				}
			});
		});
	
		return review;
	} catch (err) {
		console.error(err);
		return undefined;
	} finally {
		closeDB(db);
	}
}

// read the data from the database and return a list of review objects
export async function getAllReviewsFromTable(): Promise<Review[]> {
	const db = getDB(TABLES.REVIEWS);
	
	try {
		// await the promise to get all the reviews from the database
		const reviews = await new Promise<Review[]>((resolve, reject) => {
			// join the tables to get all the data for the reviews
			db.all(`
				SELECT Review.*, ReviewRating.*, ReviewLocation.*
				FROM Review
				INNER JOIN ReviewRating ON Review.rating_id = ReviewRating.id
				INNER JOIN ReviewLocation ON Review.location_id = ReviewLocation.id
			`, [], (err, rows: JoinedReviewRow[]) => {
				if (err) {
					reject(err);
				} else if (rows) {
					const reviews: Review[] = [];
					// create the review objects from the data
					rows.forEach((row) => {
						const city = new ReviewCity(row.zip, row.city_name, row.country);
						const rating = new ReviewRating(row.taste, row.sauce, row.ingredients, row.presentation, row.value, row.ambiance);
						const location = new ReviewLocation(city, row.street, row.number, row.mapsLink);
						const review = new Review(row.title, row.body, rating, location, row.created_at, row.img, row.price);
						review.assignId(row.id);
						reviews.push(review);

					});
					resolve(reviews);
				} else {
					resolve([]);
				}
			});
		});
	
		return reviews;
	} catch (err) {
		console.error(err);
		return [];
	} finally {
		closeDB(db);
	}
}

export function getCityFromTable(zip: string): Promise<ReviewCity | undefined> {
	const db = getDB(TABLES.REVIEWS);
	
	return new Promise<ReviewCity | undefined>((resolve, reject) => {
		db.get(`SELECT * FROM ReviewCity WHERE zip = ?`, [zip], (err, row: ReviewCityRow) => {
			if (err) {
				reject(err);
			} else if (row) {
				resolve(new ReviewCity(row.zip, row.name, row.country));
			} else {
				resolve(undefined);
			}
		});
	});
}

export function getAllCitiesFromTable(): Promise<ReviewCity[]> {
	const db = getDB(TABLES.REVIEWS);
	try {
		return new Promise<ReviewCity[]>((resolve, reject) => {
			db.all(`SELECT * FROM ReviewCity`, [], (err, rows: ReviewCityRow[]) => {
				if (err) {
					reject(err);
				} else if (rows) {
					const cities: ReviewCity[] = [];
					rows.forEach((row) => {
						cities.push(new ReviewCity(row.zip, row.name, row.country));
					});
					resolve(cities);
				} else {
					resolve([]);
				}
			});
		});
	} catch (err) {
		console.error("Tried accessing the database without it being created.");
		return Promise.resolve([]);
	}
}

// Insert a review object into the database
export function insertReviewIntoTable(review: Review): Promise<number> {
	return new Promise((resolve, reject) => {
		const currentTime = new Date().getTime();

		const db = getDB(TABLES.REVIEWS);
		if (db) {
			db.serialize(() => {
				db.get(`SELECT zip FROM ReviewCity WHERE name = ? AND country = ? AND zip = ?`,
				[review.location.city.name, review.location.city.country, review.location.city.zip], function(err, row: ReviewCityRow) {
					if (err) {
						console.error(err.message);
						reject(err);
						return;
					}
					let cityId: string | undefined = undefined;
					if (row) {
						cityId = row.zip;
					} else {
						reject(new Error('City not found'));
						return;
					}

					// Move the db.run() query that uses cityId here
					db.run(`INSERT INTO ReviewLocation (city_id, street, number, mapsLink) VALUES (?, ?, ?, ?)`,
						[cityId, review.location.street, review.location.number, review.location.mapsLink], function(err) {
						if (err) {
							console.error(err.message);
							reject(err);
							return;
						}
						const locationId = this.lastID;
						db.run(`INSERT INTO ReviewRating (taste, sauce, ingredients, presentation, value, ambiance, total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
						[review.rating.taste, review.rating.sauce, review.rating.ingredients, review.rating.presentation, review.rating.value, review.rating.ambiance, review.rating.total], function(err) {
							if (err) {
								console.error(err.message);
								reject(err);
								return;
							}
							const ratingId = this.lastID;
		
							db.run(`INSERT INTO Review (title, body, rating_id, location_id, created_at, img, created_at, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
							[review.title, review.body, ratingId, locationId, review.created_at, review.img, currentTime, review.price], function(err) {
								if (err) {
									console.error(err.message);
									reject(err);
									return;
								}
								console.log('Review inserted.');
								resolve(this.lastID);

								closeDB(db);
							});
						});
					});
				});
			});
		} else {
		  reject(new Error('Database not found'));
		}
	});
}

export function insertCityIntoTable(city: ReviewCity) : Promise<number> {
	const db = getDB(TABLES.REVIEWS);
	return new Promise((resolve, reject) => {
		db.serialize(() => {
			db.run(`INSERT INTO ReviewCity (name, country, zip) VALUES (?, ?, ?)`,
			[city.name, city.country, city.zip], function(err) {
				if (err) {
					console.error(err.message);
					reject(err);
					return;
				}
				resolve(this.lastID);
				closeDB(db);
			});
		});
	});
}

export async function clearReviewDB() {
	await clearReviewTable();
	await clearRatingsTable();
	await clearLocationTable();
	await clearCityTable();
}

function clearReviewTable() {
	return new Promise((resolve, reject) => {
		console.log('Clearing the review table...');
		const db = getDB(TABLES.REVIEWS);
		db.run('DELETE FROM Review', (err) => {
			if (err) {
				console.error(err.message);
				reject(err);
			} else {
				console.log('Cleared the review table.');
				resolve(true);
				closeDB(db);
			}
		});
	});
  }

function clearRatingsTable() {
	return new Promise((resolve, reject) => {
		console.log('Clearing the ratings table...');
		const db = getDB(TABLES.REVIEWS);
		db.run('DELETE FROM ReviewRating', (err) => {
			if (err) {
				console.error(err.message);
				reject(err);
			} else {
				console.log('Cleared the ratings table.');
				resolve(true);
				closeDB(db);
			}
		});
	});
}

function clearLocationTable() {
	return new Promise((resolve, reject) => {
		console.log('Clearing the location table...');
		const db = getDB(TABLES.REVIEWS);
		db.run('DELETE FROM ReviewLocation', (err) => {
			if (err) {
				console.error(err.message);
				reject(err);
			} else {
				console.log('Cleared the location table.');
				resolve(true);
				closeDB(db);
			}
		});
	});
}

function clearCityTable() {
	return new Promise((resolve, reject) => {
		console.log('Clearing the city table...');
		const db = getDB(TABLES.REVIEWS);
		db.run('DELETE FROM ReviewCity', (err) => {
			if (err) {
				console.error(err.message);
				reject(err);
			} else {
				console.log('Cleared the city table.');
				resolve(true);
				closeDB(db);
			}
		});
	});
}

// insert a user's rating into the database
function insertRatingIntoTable() {
	//TODO soon
}

// close the database connection
function closeDB(db: sqlite3.Database) {
	db.close((err) => {
		if (err) {
			console.error(err.message);
		}
		console.log('Closed the database connection.');
	});
}