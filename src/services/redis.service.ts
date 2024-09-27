import { isEmpty } from "lodash";
import connectRedis from "../db/redis";

class RedisService {
  private client: any;

  async connect() {
    if (isEmpty(this.client)) this.client = await connectRedis();
  }

  async insertData(data: any) {
    await this.connect();
    const { collectionName, id, data: redisData } = data;
    console.log("redisData", redisData);

    try {
      const res = await this.client.hset(`${collectionName}:${id}`, redisData);
      console.log("insert successfully");

      return res;
    } catch (error) {
      console.log("insert data error", error);
    }
  }

  async createIndex() {
    await this.connect();
    try {
      await this.client.call(
        "FT.CREATE",
        "customerIndex",
        "ON",
        "HASH",
        "PREFIX",
        "1",
        "customers:",
        "SCHEMA",
        "status",
        "TAG",
        "createdDate",
        "NUMERIC",
        "SORTABLE",
        "clientId",
        "TEXT",
        "customerFullName",
        "TEXT",
        "accountNo",
        "TEXT",
        "customerEmail",
        "TAG"
      );
      console.log("Index created successfully!");
    } catch (err) {
      console.error("Error creating index:", err);
    } finally {
      this.client.quit();
    }
  }
  async testSearch({ indexName, searchValues }: { indexName: string; searchValues: any }) {
    const { keyword, status, startDateTime, endDateTime } = searchValues;

    await this.connect();
    const searchText = keyword ? `*${keyword.replace(/[.@\\]/g, "\\$&")}*` : "";
    try {
      const results = await this.client.call(
        "FT.SEARCH",
        indexName,
        `@status:{${status}} @createdDate:[${startDateTime} ${endDateTime}] ${
          keyword
            ? `((@accountNo:${searchText}) | (@customerFullName:${searchText}) | (@customerEmail:{*${keyword.replace(
                /[.\s@\\]/g,
                "\\$&"
              )}*}) | (@clientId:${searchText}))`
            : ""
        }`
      );
      return this.formatRedisSearchResults(results);
    } catch (error) {
      console.log("error searching:", error);
    }
  }
  async multipleInsert({ indexName, data }) {
    await this.connect();
    const pipeline = this.client.pipeline();

    data.forEach((item) => {
      const redisKey = `${indexName}:${item.clientId}`;
      pipeline.hset(redisKey, item);
    });
    try {
      await pipeline.exec();
      console.log('"insert multi successfully"');

      return "insert multi successfully";
    } catch (error) {
      console.log("error multi insert", error);
    }
  }

  formatRedisSearchResults(rawResults) {
    const totalMatches = rawResults[0];
    const formatted: any = [];

    for (let i = 1; i < rawResults.length; i += 2) {
      const docKey = rawResults[i];
      const docFields = rawResults[i + 1];
      const docObject = {};
      for (let j = 0; j < docFields.length; j += 2) {
        const field = docFields[j];
        const value = docFields[j + 1];
        docObject[field] = value;
      }

      // Add the key and the document object to the formatted array
      formatted.push({
        key: docKey,
        ...docObject,
      });
    }

    return {
      totalMatches,
      documents: formatted,
    };
  }
}

export default RedisService;
