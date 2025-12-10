import { useEffect, useState } from "react";
import { adminApi } from "../../api/admin";
import { useAdminAuth } from "../../auth/AdminAuthContext";

type AvailabilityPeriod = {
    id: number;
    barberId: number;
    startDate: string;
    endDate: string;
    reason?: string;
    createdAt: string;
};

export default function BarberAvailability() {
    const { token } = useAdminAuth();
    const [barbers, setBarbers] = useState<any[]>([]);
    const [selectedBarberId, setSelectedBarberId] = useState<number | "">("");
    const [periods, setPeriods] = useState<AvailabilityPeriod[]>([]);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");

    async function loadBarbers() {
        if (!token) return;
        setBarbers(await adminApi.barbers(token));
    }

    async function loadPeriods() {
        if (!token || !selectedBarberId) return;
        const data = await adminApi.getBarberAvailability(token, Number(selectedBarberId));
        setPeriods(data);
    }

    useEffect(() => { loadBarbers(); }, [token]);
    useEffect(() => { loadPeriods(); }, [selectedBarberId, token]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!token || !selectedBarberId || !startDate || !endDate) return;

        await adminApi.createBarberAvailability(token, Number(selectedBarberId), {
            startDate,
            endDate,
            reason
        });

        setStartDate("");
        setEndDate("");
        setReason("");
        loadPeriods();
    }

    async function handleDelete(id: number) {
        if (!token) return;
        if (!confirm("Supprimer cette période d'indisponibilité ?")) return;

        await adminApi.deleteBarberAvailability(token, id);
        loadPeriods();
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Disponibilité des Barbers</h1>
                <p className="text-sm text-neutral-500">Gérer les périodes d'indisponibilité (congés, repos, etc.)</p>
            </div>

            <div className="card">
                <div className="card-body space-y-4">
                    <div>
                        <label className="text-sm text-neutral-400">Sélectionner un Barber</label>
                        <select
                            className="select w-full"
                            value={selectedBarberId}
                            onChange={(e) => setSelectedBarberId(e.target.value ? Number(e.target.value) : "")}
                        >
                            <option value="">Choisir un barber...</option>
                            {barbers.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedBarberId && (
                        <>
                            <form onSubmit={handleCreate} className="space-y-3 border-t border-neutral-800 pt-4">
                                <h3 className="font-semibold">Ajouter une période d'indisponibilité</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-sm text-neutral-400">Date début</label>
                                        <input
                                            type="date"
                                            className="input w-full"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-neutral-400">Date fin</label>
                                        <input
                                            type="date"
                                            className="input w-full"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-neutral-400">Raison (optionnel)</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        placeholder="Ex: Congés, Formation..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                    />
                                </div>

                                <button className="btn w-full sm:w-auto">Ajouter la période</button>
                            </form>

                            <div className="border-t border-neutral-800 pt-4">
                                <h3 className="font-semibold mb-3">Périodes d'indisponibilité</h3>
                                {periods.length === 0 ? (
                                    <div className="text-neutral-500 text-sm">Aucune période définie</div>
                                ) : (
                                    <div className="space-y-2">
                                        {periods.map((p) => (
                                            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                                                <div className="text-sm">
                                                    <div className="font-medium">
                                                        {new Date(p.startDate).toLocaleDateString("fr-FR")} → {new Date(p.endDate).toLocaleDateString("fr-FR")}
                                                    </div>
                                                    {p.reason && <div className="text-neutral-400 text-xs mt-1">{p.reason}</div>}
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(p.id)}
                                                    className="btn-danger text-xs px-3 py-1"
                                                >
                                                    Supprimer
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
