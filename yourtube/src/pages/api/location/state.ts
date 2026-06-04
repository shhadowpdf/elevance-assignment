import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next/dist/shared/lib/utils";

export default async function handler(req: NextApiRequest, res: NextApiResponse){
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    try{
        const response = await axios.get(`https://api.ipgeolocation.io/v3/ipgeo?apiKey=${process.env.GEO_LOCATION_API_KEY}&ip=${ip}`);
        return res.status(200).json({ state: response.data.location.state_prov });
        // return res.status(200).json({ state: "Madhya Pradesh" });
    }  catch(error){
        console.error("Error fetching geolocation data:", error);
        return res.status(500).json({ error: "Failed to fetch geolocation data" });
    }
}