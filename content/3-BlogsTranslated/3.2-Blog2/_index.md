---
title: "Blog 2"
date: 2026-07-08
weight: 2
chapter: false
pre: " <b> 3.2. </b> "
---

📌 **Infor:** Blog 2 - Logical Replication trong Amazon RDS for PostgreSQL 18

# Logical Replication in Amazon RDS for PostgreSQL 18 - Notable Improvements

**Logical replication** is a fairly familiar feature in **PostgreSQL**, allowing data to be replicated from a source database to a target database at the logical level. Instead of copying all data like **physical replication**, you can choose tables, publications, and subscriptions to synchronize data more flexibly.

In practice, logical replication is often used to synchronize data between a main system and a secondary read system, migrate databases, or push data to analytics systems. However, in previous PostgreSQL versions, when running in production, there were still a few inconvenient points such as: **generated columns could not be replicated**, **conflicts were difficult to debug**, or **forgotten replication slots retained WAL for too long**.

**PostgreSQL 18** has improved many of these issues. On **Amazon RDS for PostgreSQL 18**, operating logical replication becomes easier to monitor and more stable.

---

## How does logical replication work?

In this model, the source database is called the **publisher**, and the database receiving data is called the **subscriber**.

The publisher creates a **publication** to define which data will be sent. The subscriber creates a **subscription** to connect and receive changed data through the **WAL stream**.

> *Figure 1. Logical replication between Publisher and Subscriber on Amazon RDS for PostgreSQL 18.*

This model is very suitable when data needs to be synchronized between different PostgreSQL instances, especially in **RDS** or **Aurora** environments.

---

## Previous limitations

Before PostgreSQL 18, logical replication had several limitations:

- **Generated columns were not replicated** → easily causing missing data on the subscriber.
- **Conflicts were difficult to track** → logs had to be read and the cause had to be inferred manually.
- **Forgotten replication slots** → retained WAL for a long time, increasing storage usage.
- **Two-phase commit was difficult to change** → sometimes requiring the subscription to be dropped and the data to be synchronized again from the beginning.

PostgreSQL 18 solves almost all of these issues.

---

## STORED generated columns can now be replicated

One notable improvement is that **STORED generated columns** can now be replicated.

For example, you have a `final_price` column calculated from `base_price`, `discount_rate`, and `tax_rate`. Previously, this column was not sent to the subscriber, but now it can be enabled with:

```sql
WITH (publish_generated_columns = stored)
```

When enabled, generated columns will be replicated like normal columns.

A small note: on the subscriber side, this column should be defined as a **normal column**, not a generated column, otherwise an error will occur when applying the data.

---

## Clearer conflict monitoring

PostgreSQL 18 adds more **conflict counters** in the `pg_stat_subscription_stats` view.

You can clearly identify types of errors such as:

- Duplicate key on `INSERT`.
- `UPDATE`/`DELETE` on a row that does not exist.
- Conflicts caused by replication origin.
- Violations of multiple unique constraints.

For example, if `confl_insert_exists` increases, it means the subscriber already has data that duplicates the data sent by the publisher.

This point makes debugging much faster compared to only reading logs as before.

---

## Parallel streaming by default

Previously, large transactions had to be fully buffered before being sent → easily causing lag.

Now PostgreSQL 18 defaults to:

```sql
streaming = parallel
```

This allows data to be streamed earlier and processed in parallel by multiple workers.

As a result, **replication lag** is reduced, especially for workloads with large transactions.

You can also tune further with:

```sql
max_parallel_apply_workers_per_subscription
max_logical_replication_workers
```

---

## More flexible two-phase commit changes

Previously, enabling or disabling **two-phase commit** usually required dropping the subscription.

Now it can be changed directly:

```sql
ALTER SUBSCRIPTION sub_orders DISABLE;
ALTER SUBSCRIPTION sub_orders SET (two_phase = true);
ALTER SUBSCRIPTION sub_orders ENABLE;
```

The good point is that the replication slot remains unchanged, so there is no need to synchronize data again from the beginning.

Note: `max_prepared_transactions > 0` must be enabled on both the publisher and subscriber. On RDS, this operation requires a reboot.

---

## Automatic handling of idle replication slots

Forgotten replication slots are a common cause of uncontrolled WAL growth.

PostgreSQL 18 adds the parameter:

```sql
idle_replication_slot_timeout
```

If a slot remains idle for too long, PostgreSQL will automatically invalidate that slot to release WAL.

Some points to note:

- Default = `0`, meaning it is not enabled.
- It can be changed without a reboot.
- It is applied when a checkpoint runs.

This helps reduce the risk of disk full issues caused by forgotten slots.

---

## A few notes

When using the new features, keep in mind:

- Generated columns are only replicated if they are **STORED**.
- The subscriber should use a normal column, not a generated column.
- Some conflict counters related to replication origin require `track_commit_timestamp` to be enabled on the subscriber.
- Other counters such as duplicate key on `INSERT` or `UPDATE`/`DELETE` on a row that does not exist can still be monitored without enabling this parameter.
- Logical replication does not synchronize sequences → this should be checked if promoting the subscriber.
- It is recommended to use the same PostgreSQL 18 version to take full advantage of the features.

---

## When should these improvements be used?

These improvements are especially useful when:

- Synchronizing data to a read replica or reporting system.
- Migrating databases.
- Separating read/write workloads.
- Running multiple subscribers for different purposes.
- Wanting clearer conflict control.
- Avoiding WAL growth caused by forgotten slots.

In **RDS** or **Aurora** environments, these improvements make logical replication significantly easier to operate.

---

## Conclusion

PostgreSQL 18 brings many practical upgrades to logical replication: support for generated columns, better conflict monitoring, parallel streaming by default, flexible two-phase commit changes, and automatic handling of idle replication slots.

The most valuable point is that it makes production operation less painful, with less manual debugging, lower risk, and easier control.

If you are using **Amazon RDS for PostgreSQL** or **Aurora PostgreSQL-Compatible Edition**, this is a version very worth considering for an upgrade.

---

## Reference article link

[Logical Replication Improvements in Amazon RDS for PostgreSQL 18](https://aws.amazon.com/vi/blogs/database/logical-replication-improvements-in-amazon-rds-for-postgresql-18/)

---
![](https://hoaithoai.github.io/images/Blog/blog2.png)
