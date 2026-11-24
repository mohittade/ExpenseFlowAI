import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Search } from 'lucide-react';
import { DashboardLayout } from '../components/layout';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getContacts, updateContact, type Contact } from '../api/client';

export const Settings = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await getContacts();
      setContacts(response.contacts);
      setDrafts(Object.fromEntries(response.contacts.map((contact) => [contact.id, contact.email])));
    } catch {
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const saveContact = async (contact: Contact) => {
    const email = drafts[contact.id]?.trim();
    if (!email || !email.includes('@')) {
      toast.error('Enter a valid email address');
      return;
    }

    setSavingId(contact.id);
    try {
      const response = await updateContact(contact.id, email, contact.department, contact.role);
      setContacts((current) =>
        current.map((item) => (item.id === contact.id ? response.contact : item))
      );
      setDrafts((current) => ({ ...current, [contact.id]: response.contact.email }));
      toast.success(`${contact.name} email saved`);
    } catch {
      toast.error('Failed to save contact');
    } finally {
      setSavingId(null);
    }
  };

  const visibleContacts = contacts.filter((contact) => {
    const query = search.toLowerCase();
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query) ||
      (contact.department || '').toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout
      pageTitle="Settings"
      breadcrumbs={[{ label: 'Overview', href: '/' }, { label: 'Settings' }]}
    >
      <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
        <div>
          <h1 className="text-display-sm font-bold text-text-primary">Contacts</h1>
          <p className="text-text-secondary mt-1">Manage email recipients for report approval and delivery.</p>
        </div>

        <Card>
          <CardBody className="p-0">
            <div className="p-4 border-b border-border-default">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search contacts..."
                  className="input-field pl-9"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-10 text-center text-text-secondary">Loading contacts...</div>
            ) : (
              <div className="divide-y divide-border-default">
                {visibleContacts.map((contact) => {
                  const changed = drafts[contact.id] !== contact.email;
                  return (
                    <div key={contact.id} className="p-4 grid grid-cols-1 md:grid-cols-[220px_1fr_110px] gap-3 items-center">
                      <div>
                        <p className="font-medium text-text-primary">{contact.name}</p>
                        <p className="text-body-xs text-text-tertiary">
                          {[contact.department, contact.role].filter(Boolean).join(' • ') || 'Contact'}
                        </p>
                      </div>
                      <input
                        type="email"
                        value={drafts[contact.id] || ''}
                        onChange={(event) =>
                          setDrafts((current) => ({ ...current, [contact.id]: event.target.value }))
                        }
                        className="input-field"
                        aria-label={`Email for ${contact.name}`}
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        className="gap-1.5"
                        disabled={!changed || savingId === contact.id}
                        loading={savingId === contact.id}
                        onClick={() => saveContact(contact)}
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </Button>
                    </div>
                  );
                })}
                {visibleContacts.length === 0 && (
                  <div className="p-10 text-center text-text-secondary">No contacts found</div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
};
