import React, { useState } from 'react';
import { Client, Quote } from '../types';
import { Briefcase, Building, Mail, MapPin, Phone, Plus, Search, User, Users } from 'lucide-react';
import { calculateQuoteFinancials, formatCurrency } from '../utils/calculations';

interface ClientsViewProps {
  clients: Client[];
  quotes: Quote[];
  onAddNewClient: (client: Client) => void;
  onCreateQuoteForClient: (client: Client) => void;
  onSelectQuote: (quoteId: string) => void;
  onSwitchToJobs: () => void;
  currencySymbol?: string;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  quotes,
  onAddNewClient,
  onCreateQuoteForClient,
  onSelectQuote,
  onSwitchToJobs,
  currencySymbol = '$',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: name.trim(),
      company: company.trim() || name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim() || 'Trinidad & Tobago',
      notes: notes.trim(),
    };

    onAddNewClient(newClient);
    setShowAddClientModal(false);
    setName('');
    setCompany('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Header & Actions */}
      <div className="surface-card p-4 sm:p-6 border border-[#262F44] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#c0c1ff]" />
            <span>Commercial Client Directory</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage company contacts, commercial addresses, and directly generate targeted electrical quotations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddClientModal(true)}
          className="btn-accent-purple px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Commercial Client</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by client name, company, or site address..."
          className="custom-input w-full rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm"
        />
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredClients.map((client) => {
          const clientQuotes = quotes.filter(
            (q) =>
              q.customer.toLowerCase().includes(client.name.toLowerCase()) ||
              q.customer.toLowerCase().includes(client.company.toLowerCase()) ||
              (q.clientCompany && q.clientCompany.toLowerCase().includes(client.company.toLowerCase()))
          );

          const totalSpend = clientQuotes.reduce(
            (acc, q) => acc + calculateQuoteFinancials(q).grandTotal,
            0
          );

          return (
            <div
              key={client.id}
              className="surface-card p-5 border border-[#262F44] hover:border-[#384566] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-100">{client.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-[#c0c1ff] font-semibold mt-0.5">
                      <Building className="w-3.5 h-3.5" />
                      <span>{client.company}</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-bold bg-[#141824] px-2 py-1 rounded text-slate-400 border border-[#22293D]">
                    {clientQuotes.length} Quotes
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span>{client.address}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>{client.email}</span>
                    </div>
                  )}
                </div>

                {client.notes && (
                  <p className="text-xs text-slate-400 bg-[#121623] p-2.5 rounded-lg border border-[#1E2538] mb-4">
                    {client.notes}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#232A3E] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Total Quoted Value
                  </span>
                  <span className="font-mono font-bold text-sm text-slate-200">
                    {formatCurrency(totalSpend, currencySymbol)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onCreateQuoteForClient(client)}
                  className="btn-accent-purple px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Quote</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="surface-card p-6 w-full max-w-md border border-[#2E3A56] shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider mb-4">
              Add Commercial Client
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Contact / Representative Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Johnathan Smith"
                  className="custom-input w-full rounded-lg px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Corp Caribbean Ltd."
                  className="custom-input w-full rounded-lg px-3.5 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (868) ..."
                    className="custom-input w-full rounded-lg px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@company.tt"
                    className="custom-input w-full rounded-lg px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Site / Facility Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 100 Industrial Parkway, Point Lisas"
                  className="custom-input w-full rounded-lg px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Commercial Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment terms, special site access requirements..."
                  className="custom-input w-full rounded-lg px-3.5 py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="px-4 py-2 rounded-lg bg-transparent border border-[#2B354E] hover:border-slate-500 text-slate-400 hover:text-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-accent-purple px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
