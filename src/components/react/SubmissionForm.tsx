import { useState, useId } from 'react';

type TabId = 'object' | 'film' | 'clip';

const TRACKED_OBJECTS = [
  'Balloons',
  'Cereal',
  'Cigarettes',
  'Clocks',
  'Doors',
  'Eggs',
  'Guns',
  'Milk',
  'Mirrors',
  'Telephones',
  'Other',
];

interface FilmExample {
  title: string;
  year: string;
  note: string;
}

interface ObjectFormData {
  object_name: string;
  why_it_matters: string;
  film_examples: FilmExample[];
}

interface FilmFormData {
  film_title: string;
  year: string;
  director: string;
  object_spotted: string;
  scene_description: string;
  timestamp: string;
}

interface ClipFormData {
  film_title: string;
  object: string;
  url: string;
  timestamp: string;
  context_note: string;
}

function Label({
  htmlFor,
  children,
  optional,
}: {
  htmlFor: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-primary font-sans text-sm font-medium mb-1">
      {children}
      {optional && <span className="text-secondary font-normal ml-1">(optional)</span>}
    </label>
  );
}

function Input({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`w-full border border-divider bg-surface text-primary rounded px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-link focus:border-transparent placeholder:text-secondary/60 ${className ?? ''}`}
      {...rest}
    />
  );
}

function Textarea({
  id,
  value,
  onChange,
  placeholder,
  required,
  rows = 4,
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      rows={rows}
      className="w-full border border-divider bg-surface text-primary rounded px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-link focus:border-transparent placeholder:text-secondary/60 resize-y"
    />
  );
}

function Select({
  id,
  value,
  onChange,
  children,
  required,
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full border border-divider bg-surface text-primary rounded px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-link focus:border-transparent"
    >
      {children}
    </select>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="mb-5">{children}</div>;
}

function SubmitterFields({
  nameId,
  emailId,
  name,
  email,
  onNameChange,
  onEmailChange,
}: {
  nameId: string;
  emailId: string;
  name: string;
  email: string;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
}) {
  return (
    <div className="pt-4 border-t border-divider mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <Label htmlFor={nameId} optional>
          Your name or handle
        </Label>
        <Input
          id={nameId}
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder="Anonymous is fine"
        />
      </div>
      <div>
        <Label htmlFor={emailId} optional>
          Email
        </Label>
        <Input
          id={emailId}
          type="email"
          value={email}
          onChange={e => onEmailChange(e.target.value)}
          placeholder="For follow-up only"
        />
      </div>
    </div>
  );
}

// ── Tab 1: Suggest an Object ──────────────────────────────────────────────────

function ObjectTab({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const uid = useId();
  const [form, setForm] = useState<ObjectFormData>({
    object_name: '',
    why_it_matters: '',
    film_examples: [
      { title: '', year: '', note: '' },
      { title: '', year: '', note: '' },
      { title: '', year: '', note: '' },
    ],
  });
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.object_name.trim()) errs.object_name = 'Object name is required.';
    if (form.why_it_matters.trim().length < 50)
      errs.why_it_matters = 'Please write at least 50 characters.';
    if (submitterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail))
      errs.email = 'Enter a valid email address.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const updateExample = (index: number, field: keyof FilmExample, value: string) => {
    setForm(prev => {
      const examples = [...prev.film_examples];
      examples[index] = { ...examples[index], [field]: value };
      return { ...prev, film_examples: examples };
    });
  };

  const addExample = () => {
    setForm(prev => ({
      ...prev,
      film_examples: [...prev.film_examples, { title: '', year: '', note: '' }],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'object',
          data: form,
          submitter_name: submitterName || null,
          submitter_email: submitterEmail || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        onError(json.error ?? 'Submission failed.');
      } else {
        onSuccess();
        setForm({
          object_name: '',
          why_it_matters: '',
          film_examples: [
            { title: '', year: '', note: '' },
            { title: '', year: '', note: '' },
            { title: '', year: '', note: '' },
          ],
        });
        setSubmitterName('');
        setSubmitterEmail('');
        setErrors({});
      }
    } catch {
      onError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Label htmlFor={`${uid}-object-name`}>Object name</Label>
        <Input
          id={`${uid}-object-name`}
          value={form.object_name}
          onChange={e => setForm(p => ({ ...p, object_name: e.target.value }))}
          placeholder="e.g., Umbrellas, Keys, Newspapers"
          required
        />
        {errors.object_name && (
          <p className="text-red-600 text-xs mt-1 font-sans">{errors.object_name}</p>
        )}
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor={`${uid}-why`}>Why it matters</Label>
        <Textarea
          id={`${uid}-why`}
          value={form.why_it_matters}
          onChange={e => setForm(p => ({ ...p, why_it_matters: e.target.value }))}
          placeholder="What makes this object significant across films? What patterns have you noticed? (min. 50 characters)"
          required
          rows={5}
        />
        <p className="text-secondary text-xs mt-1 font-sans">
          {form.why_it_matters.length} characters{form.why_it_matters.length < 50 ? ` (need ${50 - form.why_it_matters.length} more)` : ''}
        </p>
        {errors.why_it_matters && (
          <p className="text-red-600 text-xs mt-1 font-sans">{errors.why_it_matters}</p>
        )}
      </FieldGroup>

      <FieldGroup>
        <p className="text-primary font-sans text-sm font-medium mb-3">Film examples</p>
        <div className="space-y-3">
          {form.film_examples.map((ex, i) => (
            <div
              key={i}
              className="border border-divider rounded p-3 bg-data-bg/40 grid grid-cols-1 sm:grid-cols-[1fr_80px_1fr] gap-3"
            >
              <div>
                <Label htmlFor={`${uid}-ex-title-${i}`}>Film title</Label>
                <Input
                  id={`${uid}-ex-title-${i}`}
                  value={ex.title}
                  onChange={e => updateExample(i, 'title', e.target.value)}
                  placeholder="Title"
                  required={i === 0}
                />
              </div>
              <div>
                <Label htmlFor={`${uid}-ex-year-${i}`}>Year</Label>
                <Input
                  id={`${uid}-ex-year-${i}`}
                  type="number"
                  value={ex.year}
                  onChange={e => updateExample(i, 'year', e.target.value)}
                  placeholder="1984"
                  min={1888}
                  max={new Date().getFullYear() + 2}
                  required={i === 0}
                />
              </div>
              <div>
                <Label htmlFor={`${uid}-ex-note-${i}`} optional>
                  Brief note
                </Label>
                <Input
                  id={`${uid}-ex-note-${i}`}
                  value={ex.note}
                  onChange={e => updateExample(i, 'note', e.target.value)}
                  placeholder="How the object appears"
                />
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addExample}
          className="mt-2 text-sm font-sans text-secondary border border-divider rounded px-3 py-1.5 hover:text-primary hover:border-primary transition-colors"
        >
          + Add another film
        </button>
      </FieldGroup>

      <SubmitterFields
        nameId={`${uid}-name`}
        emailId={`${uid}-email`}
        name={submitterName}
        email={submitterEmail}
        onNameChange={setSubmitterName}
        onEmailChange={setSubmitterEmail}
      />
      {errors.email && (
        <p className="text-red-600 text-xs mt-1 font-sans">{errors.email}</p>
      )}

      <div className="mt-6">
        <button
          type="submit"
          disabled={loading}
          className="bg-link text-white font-sans text-sm font-medium px-5 py-2.5 rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity inline-flex items-center gap-2"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {loading ? 'Submitting…' : 'Suggest this object'}
        </button>
      </div>
    </form>
  );
}

// ── Tab 2: Flag a Film ────────────────────────────────────────────────────────

function FilmTab({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const uid = useId();
  const [form, setForm] = useState<FilmFormData>({
    film_title: '',
    year: '',
    director: '',
    object_spotted: '',
    scene_description: '',
    timestamp: '',
  });
  const [submitterName, setSubmitterName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.film_title.trim()) errs.film_title = 'Film title is required.';
    if (!form.year) errs.year = 'Year is required.';
    if (!form.scene_description.trim()) errs.scene_description = 'Scene description is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'film',
          data: form,
          submitter_name: submitterName || null,
          submitter_email: null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        onError(json.error ?? 'Submission failed.');
      } else {
        onSuccess();
        setForm({
          film_title: '',
          year: '',
          director: '',
          object_spotted: '',
          scene_description: '',
          timestamp: '',
        });
        setSubmitterName('');
        setErrors({});
      }
    } catch {
      onError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px] gap-4 mb-5">
        <div>
          <Label htmlFor={`${uid}-film-title`}>Film title</Label>
          <Input
            id={`${uid}-film-title`}
            value={form.film_title}
            onChange={e => setForm(p => ({ ...p, film_title: e.target.value }))}
            placeholder="e.g., Vertigo"
            required
          />
          {errors.film_title && (
            <p className="text-red-600 text-xs mt-1 font-sans">{errors.film_title}</p>
          )}
        </div>
        <div>
          <Label htmlFor={`${uid}-film-year`}>Year</Label>
          <Input
            id={`${uid}-film-year`}
            type="number"
            value={form.year}
            onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
            placeholder="1958"
            min={1888}
            max={new Date().getFullYear() + 2}
            required
          />
          {errors.year && (
            <p className="text-red-600 text-xs mt-1 font-sans">{errors.year}</p>
          )}
        </div>
      </div>

      <FieldGroup>
        <Label htmlFor={`${uid}-director`} optional>
          Director
        </Label>
        <Input
          id={`${uid}-director`}
          value={form.director}
          onChange={e => setForm(p => ({ ...p, director: e.target.value }))}
          placeholder="e.g., Alfred Hitchcock"
        />
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor={`${uid}-object-spotted`} optional>
          Object spotted
        </Label>
        <Select
          id={`${uid}-object-spotted`}
          value={form.object_spotted}
          onChange={e => setForm(p => ({ ...p, object_spotted: e.target.value }))}
        >
          <option value="">Select an object…</option>
          {TRACKED_OBJECTS.map(obj => (
            <option key={obj} value={obj.toLowerCase()}>
              {obj}
            </option>
          ))}
        </Select>
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor={`${uid}-scene-desc`}>Scene description</Label>
        <Textarea
          id={`${uid}-scene-desc`}
          value={form.scene_description}
          onChange={e => setForm(p => ({ ...p, scene_description: e.target.value }))}
          placeholder="Describe how the object appears and why it's significant in this scene"
          required
          rows={4}
        />
        {errors.scene_description && (
          <p className="text-red-600 text-xs mt-1 font-sans">{errors.scene_description}</p>
        )}
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor={`${uid}-timestamp`} optional>
          Timestamp
        </Label>
        <Input
          id={`${uid}-timestamp`}
          value={form.timestamp}
          onChange={e => setForm(p => ({ ...p, timestamp: e.target.value }))}
          placeholder="e.g., 1:23:45"
        />
      </FieldGroup>

      <div className="pt-4 border-t border-divider mt-6">
        <div className="max-w-xs">
          <Label htmlFor={`${uid}-submitter-name`} optional>
            Your name or handle
          </Label>
          <Input
            id={`${uid}-submitter-name`}
            value={submitterName}
            onChange={e => setSubmitterName(e.target.value)}
            placeholder="Anonymous is fine"
          />
        </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={loading}
          className="bg-link text-white font-sans text-sm font-medium px-5 py-2.5 rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity inline-flex items-center gap-2"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {loading ? 'Submitting…' : 'Flag this film'}
        </button>
      </div>
    </form>
  );
}

// ── Tab 3: Submit a Clip ──────────────────────────────────────────────────────

function ClipTab({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const uid = useId();
  const [form, setForm] = useState<ClipFormData>({
    film_title: '',
    object: '',
    url: '',
    timestamp: '',
    context_note: '',
  });
  const [submitterName, setSubmitterName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.film_title.trim()) errs.film_title = 'Film title is required.';
    if (!form.object) errs.object = 'Object is required.';
    if (!form.url.trim()) {
      errs.url = 'URL is required.';
    } else {
      try {
        new URL(form.url);
      } catch {
        errs.url = 'Enter a valid URL.';
      }
    }
    if (!form.timestamp.trim()) errs.timestamp = 'Timestamp is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'clip',
          data: form,
          submitter_name: submitterName || null,
          submitter_email: null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        onError(json.error ?? 'Submission failed.');
      } else {
        onSuccess();
        setForm({ film_title: '', object: '', url: '', timestamp: '', context_note: '' });
        setSubmitterName('');
        setErrors({});
      }
    } catch {
      onError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-4 mb-5">
        <div>
          <Label htmlFor={`${uid}-clip-title`}>Film title</Label>
          <Input
            id={`${uid}-clip-title`}
            value={form.film_title}
            onChange={e => setForm(p => ({ ...p, film_title: e.target.value }))}
            placeholder="e.g., Mulholland Drive"
            required
          />
          {errors.film_title && (
            <p className="text-red-600 text-xs mt-1 font-sans">{errors.film_title}</p>
          )}
        </div>
        <div>
          <Label htmlFor={`${uid}-clip-object`}>Object</Label>
          <Select
            id={`${uid}-clip-object`}
            value={form.object}
            onChange={e => setForm(p => ({ ...p, object: e.target.value }))}
            required
          >
            <option value="">Select an object…</option>
            {TRACKED_OBJECTS.map(obj => (
              <option key={obj} value={obj.toLowerCase()}>
                {obj}
              </option>
            ))}
          </Select>
          {errors.object && (
            <p className="text-red-600 text-xs mt-1 font-sans">{errors.object}</p>
          )}
        </div>
      </div>

      <FieldGroup>
        <Label htmlFor={`${uid}-clip-url`}>URL</Label>
        <Input
          id={`${uid}-clip-url`}
          type="url"
          value={form.url}
          onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
          placeholder="https://youtube.com/watch?v=…"
          required
        />
        {errors.url && (
          <p className="text-red-600 text-xs mt-1 font-sans">{errors.url}</p>
        )}
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor={`${uid}-clip-timestamp`}>Timestamp</Label>
        <Input
          id={`${uid}-clip-timestamp`}
          value={form.timestamp}
          onChange={e => setForm(p => ({ ...p, timestamp: e.target.value }))}
          placeholder="e.g., 0:42:10"
          required
        />
        {errors.timestamp && (
          <p className="text-red-600 text-xs mt-1 font-sans">{errors.timestamp}</p>
        )}
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor={`${uid}-clip-context`} optional>
          Context note
        </Label>
        <Textarea
          id={`${uid}-clip-context`}
          value={form.context_note}
          onChange={e => setForm(p => ({ ...p, context_note: e.target.value }))}
          placeholder="What makes this clip notable? What does the object do here?"
          rows={3}
        />
      </FieldGroup>

      <div className="pt-4 border-t border-divider mt-6">
        <div className="max-w-xs">
          <Label htmlFor={`${uid}-clip-name`} optional>
            Your name or handle
          </Label>
          <Input
            id={`${uid}-clip-name`}
            value={submitterName}
            onChange={e => setSubmitterName(e.target.value)}
            placeholder="Anonymous is fine"
          />
        </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={loading}
          className="bg-link text-white font-sans text-sm font-medium px-5 py-2.5 rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity inline-flex items-center gap-2"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {loading ? 'Submitting…' : 'Submit this clip'}
        </button>
      </div>
    </form>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export default function SubmissionForm() {
  const [activeTab, setActiveTab] = useState<TabId>('object');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSuccess = () => {
    setSuccessMessage('Thank you! Your submission is pending review.');
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage(null);
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'object', label: 'Suggest an Object' },
    { id: 'film', label: 'Flag a Film' },
    { id: 'clip', label: 'Submit a Clip' },
  ];

  return (
    <div>
      {successMessage && (
        <div
          role="status"
          className="mb-6 rounded border border-green-300 bg-green-50 text-green-800 px-4 py-3 text-sm font-sans"
        >
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div
          role="alert"
          className="mb-6 rounded border border-red-300 bg-red-50 text-red-800 px-4 py-3 text-sm font-sans"
        >
          {errorMessage}
        </div>
      )}

      {/* Tab bar */}
      <div
        className="flex border-b border-divider mb-8"
        role="tablist"
        aria-label="Submission type"
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tab-panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => {
              setActiveTab(tab.id);
              setSuccessMessage(null);
              setErrorMessage(null);
            }}
            className={`font-sans text-sm px-4 py-3 -mb-px border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-link text-primary font-medium'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div
        id="tab-panel-object"
        role="tabpanel"
        aria-labelledby="tab-object"
        hidden={activeTab !== 'object'}
      >
        {activeTab === 'object' && (
          <ObjectTab onSuccess={handleSuccess} onError={handleError} />
        )}
      </div>
      <div
        id="tab-panel-film"
        role="tabpanel"
        aria-labelledby="tab-film"
        hidden={activeTab !== 'film'}
      >
        {activeTab === 'film' && (
          <FilmTab onSuccess={handleSuccess} onError={handleError} />
        )}
      </div>
      <div
        id="tab-panel-clip"
        role="tabpanel"
        aria-labelledby="tab-clip"
        hidden={activeTab !== 'clip'}
      >
        {activeTab === 'clip' && (
          <ClipTab onSuccess={handleSuccess} onError={handleError} />
        )}
      </div>
    </div>
  );
}
