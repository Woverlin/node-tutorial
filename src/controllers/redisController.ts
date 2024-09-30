import RedisService from "../services/redis.service";

export const testRedisSearchHandler = async (req, res) => {
  const rs = await new RedisService().testSearch(req.body);
  res.json(rs);
};

export const insertDataCustomerRedisHandler = async (req, res) => {
  const rs = await new RedisService().insertData(req.body);
  res.json(rs);
};

export const initIndexRedisHandler = (_, res) => {
  new RedisService().createIndex();
  res.json({});
};

export const insertMultiRowsHandler = (req, res) => {
  new RedisService().multipleInsert(req.body);
  res.json({});
};

export const insertCustomerDataHandler = async (req, res) => {
  await new RedisService().insertCustomerData(req.body);
  res.json({});
};
