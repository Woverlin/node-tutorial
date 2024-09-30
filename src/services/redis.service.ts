import { isEmpty } from "lodash";
import connectRedis from "../db/redis";
import { Redis } from "ioredis";
import { CustomerRepository, ICustomer } from "fms-models";

const customerRepository = CustomerRepository.getInstance();
class RedisService {
  private client: Redis;
  private batchingCustomerSize = 100;

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
        "createdDate",
        "NUMERIC",
        "SORTABLE",
        "clientId",
        "TEXT",
        "customerFullName",
        "TEXT",
        "accounts",
        "TAG",
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
  async testSearch({
    indexName,
    searchValues,
    paging,
  }: {
    indexName: string;
    searchValues: any;
    paging: any;
  }) {
    const { keyword, status, startDateTime, endDateTime } = searchValues;
    await this.connect();
    const searchText = keyword ? `*${keyword.replace(/[.@\\]/g, "\\$&")}*` : "";
    const searchTextTag = keyword ? `*${keyword.replace(/[.\s@\\]/g, "\\$&")}*` : "";
    const { pageNumber, pageSize } = paging;

    try {
      const results = await this.client.call(
        "FT.SEARCH",
        indexName,
        `@createdDate:[${startDateTime} ${endDateTime}] ${
          keyword
            ? `((@accounts:${searchTextTag}) | (@customerFullName:${searchText}) | (@customerEmail:{${searchTextTag}}) | (@clientId:${searchText}))`
            : ""
        }`,
        "LIMIT",
        pageNumber,
        pageSize
      );
      return this.formatRedisSearchResults(results, pageSize);
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

  formatRedisSearchResults(rawResults, pageSize) {
    const total = rawResults[0];
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
      total,
      documents: formatted,
    };
  }

  async insertCustomerData({ indexName }: { indexName: string; searchValues: any }) {
    await this.connect();
    try {
      const customers = await customerRepository.aggregate([
        {
          $match: {
            createdDate: { $gte: 1727410320000, $lte: 1727481599000 },
          },
        },
        {
          $project: {
            _id: 0,
            createdDate: 1,
            clientId: 1,
            customerEmail: "$email",
            customerFullName: {
              $reduce: {
                input: ["$firstName", "$middleName", "$lastName"],
                initialValue: "",
                in: {
                  $cond: {
                    if: { $eq: ["$$this", ""] },
                    then: "$$value",
                    else: {
                      $cond: {
                        if: { $eq: ["$$value", ""] },
                        then: "$$this",
                        else: { $concat: ["$$value", " ", "$$this"] },
                      },
                    },
                  },
                },
              },
            },
            accounts: 1,
          },
        },
      ]);
      console.log("====================================");
      console.log("customers", customers.length);
      console.log("====================================");
      while (customers.length) {
        const pipeline = this.client.pipeline();
        const batchingCustomers: any = customers.splice(0, this.batchingCustomerSize);

        batchingCustomers.forEach((item: ICustomer) => {
          const { clientId } = item;
          const redisKey = `${indexName}:${clientId}`;
          pipeline.hset(redisKey, item);
        });
        await pipeline.exec();
      }
    } catch (error) {
      console.log("====================================");
      console.log("123123123", error);
      console.log("====================================");
    }
  }
}

export default RedisService;
