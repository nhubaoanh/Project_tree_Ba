import { injectable } from "tsyringe";
import { Pool, PoolConnection, createPool } from "mysql2/promise";
import { config } from "./config";

// cau hinh
const connectionConfig = {
    host: config.db.host,
    port: config.db.port,
    user: config.db.username,
    password: config.db.password,
    database: config.db.database
};

@injectable()
export class Database {
  private pool: Pool;
  constructor() {
    this.pool = createPool(connectionConfig);
    console.log("connect_database success");
  }

  public async getRawConnection(): Promise<PoolConnection> {
    return await this.pool.getConnection();
  }

  public async query(sql: string, values: any[]): Promise<any> {
    let connection: PoolConnection | null = null;

    try {
      connection = await this.pool.getConnection();
      const [results] = await connection.query(sql, values);

      // Một số truy vấn (CALL stored procedure) dùng biến OUT @err_code/@err_msg.
      // Với truy vấn SQL bình thường, các biến này sẽ không được set và trả về null.
      const [outParams]: any = await connection.query("SELECT @err_code AS err_code, @err_msg AS err_msg");
      const err: any = Array.isArray(outParams) ? outParams[0] : outParams;

      if (err && typeof err.err_code !== "undefined" && err.err_code !== null) {
        if (Number(err.err_code) === 0) {
          return results;
        }
        throw new Error(err.err_msg || "Database returned an error");
      }

      return results;
    } catch (error) {
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  // Raw query - không kiểm tra @err_code/@err_msg (dùng cho SELECT thuần)
  public async rawQuery(sql: string, values: any[]): Promise<any> {
    let connection: PoolConnection | null = null;

    try {
      connection = await this.pool.getConnection();
      const result = await connection.query(sql, values);
      return result;
    } catch (error) {
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
}
