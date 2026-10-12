import Dashboard from "@/components/Dashboard";
import { getPolicy } from "@/lib/api/policies";
import { getTransactions } from "@/lib/api/transactions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [transactions, policy] = await Promise.all([getTransactions(), getPolicy()]);
  return <Dashboard initialTransactions={transactions} initialPolicy={policy} />;
}
