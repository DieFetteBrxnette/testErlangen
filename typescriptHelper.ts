export interface ReviewCityRow {
    name: string;
    country: string;
    zip: string;
}

export interface ReviewLocationRow {
    city_id: number;
    street: string;
    number: number;
    mapsLink: string;
}

export interface ReviewRatingRow {
    taste: number;
    sauce: number;
    ingredients: number;
    presentation: number;
    value: number;
    ambiance: number;
    total: number;
}

export interface ReviewRow {
    id: number;
    title: string;
    body: string;
    rating_id: number;
    location_id: number;
    created_at: Date;
    img: string;
}

export interface JoinedReviewRow {
    id: number;
    title: string;
    body: string;
    taste: number;
    sauce: number;
    ingredients: number;
    presentation: number;
    value: number;
    ambiance: number;
    total: number;
    city_id: number;
    city_name: string;
    country: string;
    zip: string;
    street: string;
    number: number;
    mapsLink: string;
    created_at: Date;
    img: string;
    price: number;
}

export interface ReviewBody {
    id: number;
    title: string;
    body: string;
    taste: number;
    sauce: number;
    ingredients: number;
    presentation: number;
    value: number;
    ambiance: number;
    zip: string;
    street: string;
    number: number;
    mapsLink: string;
    created_at: Date;
    img: string;
    price: number;
}

export interface CityBody {
    name: string;
    country: string;
    zip: string;
}

