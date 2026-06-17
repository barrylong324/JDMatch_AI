-- ============================================
-- 修复：创建缺失的数据库函数和扩展
-- 线上 Neon 数据库报错的根本原因：
-- 1. generate_big_id() 函数未创建（所有表的主键默认值依赖它）
-- 2. pgvector 扩展未启用（向量嵌入功能依赖它）
-- ============================================

-- 启用 pgvector 扩展（用于向量嵌入相似度搜索）
CREATE EXTENSION IF NOT EXISTS vector;

-- 全局 ID 序列（Snowflake 风格 ID 生成器）
CREATE SEQUENCE IF NOT EXISTS global_id_seq;

-- Snowflake 风格的大整数 ID 生成函数
-- 结构：[41位时间戳(毫秒)] [5位分片ID] [10位序列号] = 56位
CREATE OR REPLACE FUNCTION generate_big_id()
RETURNS TEXT AS $$
DECLARE
    epoch_ms   BIGINT := 1700000000000;  -- 2023-11-14 作为起始时间戳
    shard_id   INT    := 1;              -- 分片ID（单机部署固定为1）
    seq        BIGINT;
    now_ms     BIGINT;
    result     BIGINT;
BEGIN
    SELECT nextval('global_id_seq') INTO seq;
    SELECT FLOOR(EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT INTO now_ms;

    -- 组装 Snowflake ID
    result := (now_ms - epoch_ms) << 22;   -- 41 位时间戳
    result := result | (shard_id << 10);    -- 5 位分片
    result := result | (seq % 1024);        -- 10 位序列号

    RETURN result::TEXT;
END;
$$ LANGUAGE plpgsql;
