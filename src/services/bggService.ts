import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

export interface BGGGame {
  id: string;
  name: string;
  thumbnail: string;
  image: string;
  description: string;
  yearpublished: string;
  minplayers: number;
  maxplayers: number;
  playingtime: number;
  rating: number;
  categories: string[];
  themes: string[];
  publisher: string;
  publisherUrl?: string;
}

export const searchBGG = async (query: string): Promise<{ id: string; name: string; year?: string }[]> => {
  const response = await fetch(`/api/bgg/search?query=${encodeURIComponent(query)}`);
  const xml = await response.text();
  const jsonObj = parser.parse(xml);
  
  const items = jsonObj.items.item;
  if (!items) return [];
  
  const results = Array.isArray(items) ? items : [items];
  return results.map((item: any) => ({
    id: item["@_id"],
    name: Array.isArray(item.name) ? item.name.find((n: any) => n["@_type"] === "primary")["@_value"] : item.name["@_value"],
    year: item.yearpublished?.["@_value"]
  }));
};

export const getBGGGameDetails = async (id: string): Promise<BGGGame | null> => {
  const response = await fetch(`/api/bgg/thing?id=${id}`);
  const xml = await response.text();
  const jsonObj = parser.parse(xml);
  
  const item = jsonObj.items.item;
  if (!item) return null;
  
  const name = Array.isArray(item.name) 
    ? item.name.find((n: any) => n["@_type"] === "primary")["@_value"] 
    : item.name["@_value"];
    
  const links = Array.isArray(item.link) ? item.link : [item.link];
  const categories = links.filter((l: any) => l["@_type"] === "boardgamecategory").map((l: any) => l["@_value"]);
  const themes = links.filter((l: any) => l["@_type"] === "boardgametheme").map((l: any) => l["@_value"]);
  const publisher = links.find((l: any) => l["@_type"] === "boardgamepublisher")?.["@_value"] || "";

  return {
    id: item["@_id"],
    name,
    thumbnail: item.thumbnail,
    image: item.image,
    description: item.description,
    yearpublished: item.yearpublished?.["@_value"],
    minplayers: parseInt(item.minplayers?.["@_value"]),
    maxplayers: parseInt(item.maxplayers?.["@_value"]),
    playingtime: parseInt(item.playingtime?.["@_value"]),
    rating: parseFloat(item.statistics?.ratings?.average?.["@_value"]),
    categories,
    themes,
    publisher,
    publisherUrl: publisher ? `https://www.google.com/search?q=${encodeURIComponent(publisher)}+board+game+publisher` : undefined
  };
};

export const importBGGCollection = async (username: string): Promise<string[]> => {
  const response = await fetch(`/api/bgg/collection?username=${encodeURIComponent(username)}`);
  if (response.status === 202) {
    // BGG is processing the request, need to retry later.
    throw new Error("BGG is processing your collection. Please try again in a few seconds.");
  }
  const xml = await response.text();
  const jsonObj = parser.parse(xml);
  
  const items = jsonObj.items.item;
  if (!items) return [];
  
  const results = Array.isArray(items) ? items : [items];
  return results.map((item: any) => item["@_objectid"]);
};
