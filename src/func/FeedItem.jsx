import axios from "axios";
import { baseUrl } from "../../baseUrl";

export async function FeedItems(token, url, olderThan, excludeItemIdPrefixes, komentarHashes) {
    const excludePrefixes = excludeItemIdPrefixes && excludeItemIdPrefixes.length ? excludeItemIdPrefixes : undefined;

    const bodynya = {
        "feedKey": url,
        "olderThan": olderThan,
        ...(excludePrefixes && { "excludeItemIdPrefixes": excludePrefixes }),
        "viewedCastHashes": "",
        "updateState": true
    };

    try {
        const response = await axios.post(`${baseUrl}feed-items`, bodynya, {
            headers: {
                "Authorization": token,
            }
        });

        const data = response.data.result;

        const filteredItems = data.items.filter(item => !komentarHashes.has(item.cast.hash));

        return {
            ...data,
            items: filteredItems
        };
    } catch (error) {
        console.error("Error fetching feed items:", error);
        return { items: [] };
    }
}
