import type { FC } from "react";
import { syntheticAdminLog } from "../../../data/synthetic/admin";

type Props = { poolId: string };

export const PoolAdmin: FC<Props> = ({ poolId }) => {
  const data = syntheticAdminLog[poolId];
  if (!data) return null;

  return (
    <div className="relative card-surface text-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-extrabold tracking-wide text-amber-300 drop-shadow">
          Admin Config Change Log
        </h2>
        <span className="text-xs text-cyan-100/80">
          From <span className="text-amber-300">MarginPoolConfigUpdated</span>,{" "}
          <span className="text-amber-300">InterestParamsUpdated</span>,{" "}
          <span className="text-amber-300">DeepbookPoolUpdated</span>
        </span>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-300/60 to-transparent mb-6"></div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div
          className="rounded-2xl p-4 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-1">Total Changes</div>
          <div className="text-3xl font-extrabold">{data.totals.total}</div>
        </div>
        <div
          className="rounded-2xl p-4 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-1">
            Interest Param Updates
          </div>
          <div className="text-3xl font-extrabold">{data.totals.interest}</div>
        </div>
        <div
          className="rounded-2xl p-4 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-1">
            Pool Config Updates
          </div>
          <div className="text-3xl font-extrabold">{data.totals.pool}</div>
        </div>
        <div
          className="rounded-2xl p-4 bg-white/5 border relative overflow-hidden"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-1">
            DeepBook Links Updated
          </div>
          <div className="text-3xl font-extrabold">{data.totals.deepbook}</div>
          <span className="pointer-events-none absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-amber-300/15 blur-xl"></span>
        </div>
      </div>

      {/* History List */}
      <div
        className="rounded-2xl p-5 bg-white/5 border"
        style={{
          borderColor:
            "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-cyan-100/90">History</div>
          <div className="text-[11px] text-cyan-100/70">most recent first</div>
        </div>

        <div className="space-y-3">
          {data.interestUpdates.map((it, idx) => (
            <div
              key={`interest-${idx}`}
              className="grid grid-cols-12 gap-3 items-start rounded-xl p-4 bg-white/5 border border-cyan-300/30 relative overflow-hidden"
            >
              <div className="col-span-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_2px_rgba(34,211,238,0.5)]"></span>
                <span className="text-xs text-cyan-100/90 font-semibold">
                  Interest Updated
                </span>
              </div>
              <div className="col-span-4 text-xs text-cyan-100/80">
                pool:{" "}
                <a
                  href="#"
                  className="text-cyan-200 underline decoration-cyan-400/40"
                >
                  {it.pool}
                </a>
                <br />
                ts: <span className="text-cyan-100/70">{it.timestamp}</span>
              </div>
              <div className="col-span-6 text-xs">
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-white/5 rounded-lg p-2 border border-cyan-300/20">
                    <div className="text-cyan-100/70">base_rate</div>
                    <div>
                      <span className="line-through text-cyan-100/60">
                        {it.before.base_rate}
                      </span>{" "}
                      →{" "}
                      <span className="text-amber-300 font-semibold">
                        {it.after.base_rate}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 border border-cyan-300/20">
                    <div className="text-cyan-100/70">base_slope</div>
                    <div>
                      <span className="line-through text-cyan-100/60">
                        {it.before.base_slope}
                      </span>{" "}
                      →{" "}
                      <span className="text-amber-300 font-semibold">
                        {it.after.base_slope}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 border border-cyan-300/20">
                    <div className="text-cyan-100/70">optimal_u</div>
                    <div>
                      <span className="line-through text-cyan-100/60">
                        {it.before.optimal_u}
                      </span>{" "}
                      →{" "}
                      <span className="text-amber-300 font-semibold">
                        {it.after.optimal_u}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 border border-cyan-300/20">
                    <div className="text-cyan-100/70">excess_slope</div>
                    <div>
                      <span className="line-through text-cyan-100/60">
                        {it.before.excess_slope}
                      </span>{" "}
                      →{" "}
                      <span className="text-amber-300 font-semibold">
                        {it.after.excess_slope}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {data.poolConfigUpdates.map((pc, idx) => (
            <div
              key={`pool-${idx}`}
              className="grid grid-cols-12 gap-3 items-start rounded-xl p-4 bg-white/5 border border-amber-300/30 relative overflow-hidden"
            >
              <div className="col-span-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_10px_2px_rgba(251,191,36,0.5)]"></span>
                <span className="text-xs text-cyan-100/90 font-semibold">
                  Pool Config
                </span>
              </div>
              <div className="col-span-4 text-xs text-cyan-100/80">
                pool:{" "}
                <a
                  href="#"
                  className="text-cyan-200 underline decoration-cyan-400/40"
                >
                  {pc.pool}
                </a>
                <br />
                ts: <span className="text-cyan-100/70">{pc.timestamp}</span>
              </div>
              <div className="col-span-6 text-xs">
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-white/5 rounded-lg p-2 border border-amber-300/20">
                    <div className="text-cyan-100/70">supply_cap</div>
                    <div>
                      <span className="line-through text-cyan-100/60">
                        {pc.before.supply_cap}
                      </span>{" "}
                      →{" "}
                      <span className="text-amber-300 font-semibold">
                        {pc.after.supply_cap}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 border border-amber-300/20">
                    <div className="text-cyan-100/70">max_utilization_rate</div>
                    <div>
                      <span className="line-through text-cyan-100/60">
                        {pc.before.max_util}
                      </span>{" "}
                      →{" "}
                      <span className="text-amber-300 font-semibold">
                        {pc.after.max_util}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 border border-amber-300/20">
                    <div className="text-cyan-100/70">protocol_spread</div>
                    <div>
                      <span className="line-through text-cyan-100/60">
                        {pc.before.protocol_spread}
                      </span>{" "}
                      →{" "}
                      <span className="text-amber-300 font-semibold">
                        {pc.after.protocol_spread}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 border border-amber-300/20">
                    <div className="text-cyan-100/70">min_borrow</div>
                    <div>
                      <span className="line-through text-cyan-100/60">
                        {pc.before.min_borrow}
                      </span>{" "}
                      →{" "}
                      <span className="text-amber-300 font-semibold">
                        {pc.after.min_borrow}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {data.deepbookUpdates.map((db, idx) => (
            <div
              key={`db-${idx}`}
              className="grid grid-cols-12 gap-3 items-start rounded-xl p-4 bg-white/5 border border-blue-300/30 relative overflow-hidden"
            >
              <div className="col-span-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-300 shadow-[0_0_10px_2px_rgba(147,197,253,0.5)]"></span>
                <span className="text-xs text-cyan-100/90 font-semibold">
                  DeepBook Link
                </span>
              </div>
              <div className="col-span-4 text-xs text-cyan-100/80">
                pool:{" "}
                <a
                  href="#"
                  className="text-cyan-200 underline decoration-cyan-400/40"
                >
                  {db.pool}
                </a>
                <br />
                ts: <span className="text-cyan-100/70">{db.timestamp}</span>
              </div>
              <div className="col-span-6 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/5 rounded-lg p-2 border border-blue-300/20">
                    <div className="text-cyan-100/70">deepbook_pool_id</div>
                    <div className="text-amber-300 font-semibold">
                      {db.deepbook_pool_id}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 border border-blue-300/20">
                    <div className="text-cyan-100/70">pool_cap_id</div>
                    <div className="text-amber-300 font-semibold">
                      {db.pool_cap_id}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 border border-blue-300/20">
                    <div className="text-cyan-100/70">enabled</div>
                    <div>
                      <span className="px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-300/40">
                        {String(db.enabled)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 text-[11px] text-cyan-100/70 leading-relaxed">
        Bind directly to events:{" "}
        <span className="text-amber-300">InterestParamsUpdated</span> (kinked
        curve params),{" "}
        <span className="text-amber-300">MarginPoolConfigUpdated</span> (caps,
        spread, min borrow), and{" "}
        <span className="text-amber-300">DeepbookPoolUpdated</span> (allowed
        pool links). Group by{" "}
        <span className="text-cyan-200">margin_pool_id</span>, sort desc by
        timestamp, and add deep links to pool detail.
      </div>
    </div>
  );
};

export default PoolAdmin;
