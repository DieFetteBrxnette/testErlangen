import { ReviewBody } from "./typescriptHelper";

export const cities: ReviewCity[] = [];

export class Review {
    title: string;
    body: string;
    rating: ReviewRating;
    location: ReviewLocation;
    created_at: Date;
    img: string;
    id: number = -1;
    price: number;
  
    constructor(title: string, body: string, rating: ReviewRating, location: ReviewLocation, created_at: Date, img: string, price: number) {
      this.title = title;
      this.body = body;
      this.rating = rating;
      this.location = location;
      this.created_at = created_at;
      this.img = img;
      this.price = price;
    }

    assignId(id: number) {
        this.id = id;
    }
}

export class ReviewRating {
    taste: number;
    sauce: number;
    ingredients: number;
    presentation: number;
    value: number;
    ambiance: number;
    total: number;

    constructor(taste: number, sauce: number, ingredients: number, presentation: number, value: number, ambiance: number) {
        this.taste = taste;
        this.sauce = sauce;
        this.ingredients = ingredients;
        this.presentation = presentation;
        this.value = value;
        this.ambiance = ambiance;
        this.total = (taste + sauce + ingredients + presentation + value + ambiance) / 6;
    }
}

export class ReviewCity {
    name: string;
    country: string;
    zip: string;

    constructor(zip: string, name: string, country: string) {
        this.name = name;
        this.country = country;
        this.zip = zip;

        if (!cities.includes(this)) {
            cities.push(this);
        }
    }
}

export class ReviewLocation {
    city: ReviewCity;
    street: string;
    number: number;
    mapsLink: string;

    constructor(city: ReviewCity, street: string, number: number, mapsLink: string) {
        this.city = city;
        this.street = street;
        this.number = number;
        this.mapsLink = mapsLink;
    }
}

export function generateReviewFromBody(body: ReviewBody): Review | undefined{
    const rating = new ReviewRating(body.taste, body.sauce, body.ingredients, body.presentation, body.value, body.ambiance);

    let city = cities.find(city => city.zip == body.zip);

    if (!city) {
        return undefined;
    }

    const location = new ReviewLocation(city, body.street, body.number, body.mapsLink);
    return new Review(body.title, body.body, rating, location, body.created_at, body.img, body.price);
}

export function generateCityFromBody(body: ReviewCity): ReviewCity | undefined {
    const city = new ReviewCity(body.zip, body.name, body.country);
    return city;
}