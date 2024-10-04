// @ts-nocheck
import { isEmpty, map } from "lodash";
import connectRedis from "../db/redis";
import { Redis } from "ioredis";
import { CustomerRepository, ICustomer } from "fms-models";

const customerRepository = CustomerRepository.getInstance();
class RedisService {
  private client: Redis;

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
        "clientId",
        "TEXT",
        "SORTABLE",
        "createdDate",
        "NUMERIC",
        "SORTABLE",
        "dateOfBirth",
        "NUMERIC",
        "fullName",
        "TEXT",
        "email",
        "TAG",
        "idNumber",
        "TEXT",
        "accounts",
        "TAG"
      );
      console.log("Index created successfully!");
    } catch (err) {
      console.error("Error creating index:", err);
    } finally {
      this.client.quit();
    }
  }

  async queryCustomerData({ email }) {
    const regex = new RegExp(email, "i");
    return await customerRepository.find({ email });
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
    const { keyword, startDateTime, endDateTime } = searchValues;
    await this.connect();
    const searchText = keyword ? `${keyword.replace(/[.@\\]/g, "\\$&")}` : "";
    const searchTextTag = keyword ? `*${keyword.replace(/[.\s@\\]/g, "\\$&")}*` : "";
    const { pageNumber, pageSize } = paging;
    console.log("searchText", JSON.stringify(searchText));

    try {
      const query: any[] = [
        "FT.AGGREGATE",
        indexName,
        // `${
        //   keyword
        //     ? `((@accounts:{${searchText}}) | (@fullName:${searchText}) | (@email*${searchText}) | (@clientId:${searchText}) | (@idNumber:${searchText}))`
        //     : ""
        // }`,
        // `${keyword ? `(@email:{${searchTextTag}})` : "*"}`,
        `${keyword ? `@fullName:*${searchText}*` : "*"}`,
        "SORTBY",
        "2",
        "@dateOfBirth",
        "DESC",
        "LIMIT",
        pageNumber,
        pageSize,
        "LOAD",
        "3",
        "clientId",
        "email",
        "fullName",
        "DIALECT",
        "3",
      ];

      console.log(...query);
      const results = await this.client.call(...query);

      let data: any;

      data = this.formatData(results);
      return data;
    } catch (error) {
      console.log("error searching:", error);
    }
  }

  async searchCombineMongo({
    indexName,
    searchValues,
    paging,
  }: {
    indexName: string;
    searchValues: any;
    paging: any;
  }) {
    const { keyword, startDateTime, endDateTime } = searchValues;
    await this.connect();
    const searchText = keyword ? `*${keyword.replace(/[.@\\]/g, "\\$&")}*` : "";
    const searchTextTag = keyword ? `*${keyword.replace(/[.\s@\\]/g, "\\$&")}*` : "";
    const { pageNumber, pageSize } = paging;

    try {
      const results = await this.client.call(
        "FT.AGGREGATE",
        indexName,
        // `${
        //   keyword
        //     ? `((@accounts:${searchTextTag}) | (@fullName:${searchText}) | (@email:{${searchTextTag}}) | (@clientId:${searchText}) | (@idNumber:${searchText}))`
        //     : ""
        // }`,
        `${keyword ? `(@email:{${searchTextTag}})` : "*"}`,
        // "SORTBY",
        // "2",
        // "@dateOfBirth",
        // "DESC",
        "LIMIT",
        pageNumber,
        pageSize,
        "LOAD",
        "1",
        "clientId"
      );

      let data: any;

      data = this.formatData(results);

      const clientIds = map(data?.data, (it) => +it?.clientId);
      return await customerRepository.find({ clientId: { $in: clientIds } });
      // const query: any = [
      //   {
      //     $match: {
      //       clientId: { $in: clientIds },
      //     },
      //   },
      //   {
      //     $project: {
      //       fullName: {
      //         $reduce: {
      //           input: ["$firstName", "$middleName", "$lastName"],
      //           initialValue: "",
      //           in: {
      //             $cond: {
      //               if: { $eq: ["$$this", ""] },
      //               then: "$$value",
      //               else: {
      //                 $cond: {
      //                   if: { $eq: ["$$value", ""] },
      //                   then: "$$this",
      //                   else: { $concat: ["$$value", " ", "$$this"] },
      //                 },
      //               },
      //             },
      //           },
      //         },
      //       },
      //       clientId: 1,
      //       dateOfBirth: 1,
      //       email: 1,
      //       communicationAddress: 1,
      //       communicationAddressState: 1,
      //       communicationAddressCity: 1,
      //       communicationAddressCountry: 1,
      //       otherContactNumber: 1,
      //       crpStatusId: 1,
      //       applicationStageId: 1,
      //       channelId: 1,
      //       crpLevel: 1,
      //       createdDate: 1,
      //       idNumber: 1,
      //       idType: 1,
      //       accounts: 1,
      //       note: 1,
      //       hasAlert: 1,
      //     },
      //   },
      //   { $sort: { createdDate: -1, fullName: 1 } },
      //   {
      //     $facet: {
      //       data: [
      //         {
      //           $lookup: {
      //             from: "accounts",
      //             localField: "clientId",
      //             foreignField: "clientId",
      //             pipeline: [
      //               { $match: { isDeleted: { $ne: true } } },
      //               { $project: { accountNo: 1, createdDate: 1 } },
      //               { $sort: { createdDate: -1 } },
      //             ],
      //             as: "accounts",
      //           },
      //         },
      //         {
      //           $lookup: {
      //             from: "identifications",
      //             localField: "idType",
      //             foreignField: "id",
      //             pipeline: [{ $limit: 1 }],
      //             as: "identificationInfo",
      //           },
      //         },
      //         {
      //           $addFields: {
      //             identificationInfo: { $first: "$identificationInfo" },
      //             accountNo: { $first: "$accounts.accountNo" },
      //           },
      //         },
      //       ],
      //     },
      //   },
      // ];
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

  formatData(inputData) {
    const total = inputData[0]; // Get the total number
    const formattedData = [];

    for (let i = 1; i < inputData.length; i++) {
      const itemArray = inputData[i];
      const obj = {};

      for (let j = 0; j < itemArray.length; j += 2) {
        const key = itemArray[j];
        const value = itemArray[j + 1];
        obj[key] = value;
      }

      formattedData.push(obj);
    }

    return {
      total: total,
      data: formattedData,
    };
  }

  async insertCustomerData({ indexName }: { indexName: string; searchValues: any }) {
    await this.connect();
    let batchingCustomerSize = 10000;
    let skip = 0;
    let hasMore = true;
    const BATCH_SIZE = 50000;
    try {
      while (hasMore) {
        const customers = await customerRepository.find(
          {},
          {
            _id: 0,
            createdDate: 1,
            dateOfBirth: 1,
            clientId: 1,
            email: 1,
            idNumber: 1,
            fullName: {
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
          {
            limit: BATCH_SIZE,
            skip: skip,
            sort: { clientId: 1 },
          }
        );
        if (!customers?.length) hasMore = false;
        while (customers.length) {
          const pipeline = this.client.pipeline();
          const batchingCustomers: any = customers.splice(0, batchingCustomerSize);

          batchingCustomers.forEach((item: ICustomer) => {
            const { clientId } = item;
            const redisKey = `${indexName}:${clientId}`;
            pipeline.hset(redisKey, item);
          });
          await pipeline.exec();
        }
        console.log("total handled Customer = ", skip);
        skip += BATCH_SIZE;
      }
    } catch (error) {
      console.log("====================================");
      console.log("123123123", error);
      console.log("====================================");
    }
  }
}

export default RedisService;

//FT.AGGREGATE customerIndex "*lejoyrequinala*" sortby 2 @clientId DESC LIMIT 0 1 load 1 clientId

//FT.AGGREGATE customerIndex @email:{lejoyrequinala\@gmail\.c} LIMIT 0 1

//ft.AGGREGATE customerIndex @email:{*001tobedoctor\@gmail\.com*} LIMIT 0 10 load 1
