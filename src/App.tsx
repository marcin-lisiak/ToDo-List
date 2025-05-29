import { useState, useRef, useEffect } from 'react'

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  deadline?: Date;
}

function formatDate(date: Date) {
  // Formatowanie daty do czytelnej postaci
  return date.toLocaleString();
}

function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const stored = localStorage.getItem('todos');
    if (stored) {
      try {
        const parsed: Todo[] = JSON.parse(stored);
        return parsed.map(todo => ({
          ...todo,
          createdAt: new Date(todo.createdAt),
          completedAt: todo.completedAt ? new Date(todo.completedAt) : undefined,
        }));
      } catch {
        return [];
      }
    }
    return [];
  });
  const [newTodo, setNewTodo] = useState('');
  const [newDeadline, setNewDeadline] = useState<string>('');
  const [openTooltipId, setOpenTooltipId] = useState<number | null>(null);
  const tooltipRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Nowe stany do edycji
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const editingInputRef = useRef<HTMLInputElement | null>(null);

  // Nowy stan do filtrowania
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Dark mode: stan i obsługa
  const [darkMode, setDarkMode] = useState(() => {
    // Sprawdź LocalStorage lub preferencje systemowe
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Ustaw klasę dark na <html> i zapisz do LocalStorage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Odczyt z LocalStorage przy starcie
  useEffect(() => {
    const stored = localStorage.getItem('todos');
    if (stored) {
      try {
        const parsed: Todo[] = JSON.parse(stored);
        // Konwersja stringów na Date
        setTodos(parsed.map(todo => ({
          ...todo,
          createdAt: new Date(todo.createdAt),
          completedAt: todo.completedAt ? new Date(todo.completedAt) : undefined,
        })));
      } catch (e) {
        // Jeśli coś pójdzie nie tak, nie ustawiamy nic
      }
    }
  }, []);

  // Zapis do LocalStorage przy każdej zmianie todos
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // Zamykaj tooltip po kliknięciu poza nim
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (openTooltipId !== null) {
        const ref = tooltipRefs.current[openTooltipId];
        if (ref && !ref.contains(event.target as Node)) {
          setOpenTooltipId(null);
        }
      }
    }
    if (openTooltipId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openTooltipId]);

  // Ustaw focus na input edycji po rozpoczęciu edycji
  useEffect(() => {
    if (editingId !== null && editingInputRef.current) {
      editingInputRef.current.focus();
    }
  }, [editingId]);

  const addTodo = () => {
    if (newTodo.trim() === '') return;
    setTodos([
      ...todos,
      {
        id: Date.now(),
        text: newTodo,
        completed: false,
        createdAt: new Date(),
        deadline: newDeadline ? new Date(newDeadline) : undefined,
      },
    ]);
    setNewTodo('');
    setNewDeadline('');
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => {
      if (todo.id === id) {
        if (!todo.completed) {
          // Jeśli task był nieukończony, ustaw datę zakończenia
          return { ...todo, completed: true, completedAt: new Date() };
        } else {
          // Jeśli task był ukończony, usuwamy datę zakończenia
          const { completedAt, ...rest } = todo;
          return { ...rest, completed: false };
        }
      }
      return todo;
    }));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // Rozpocznij edycję zadania
  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingText(todo.text);
  };

  // Zatwierdź edycję (Enter lub blur)
  const submitEdit = () => {
    if (editingId !== null) {
      setTodos(todos.map(todo =>
        todo.id === editingId ? { ...todo, text: editingText } : todo
      ));
      setEditingId(null);
      setEditingText('');
    }
  };

  // Anuluj edycję (np. Esc)
  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  // Funkcja filtrująca zadania
  const filteredTodos = todos.filter(todo => {
    if (filter === 'all') return true;
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  // Liczniki do podsumowania
  const total = todos.length;
  const active = todos.filter(t => !t.completed).length;
  const completed = todos.filter(t => t.completed).length;

  // Kolorowanie zadań po terminie
  const isOverdue = (todo: Todo) => {
    return (
      todo.deadline &&
      !todo.completed &&
      new Date(todo.deadline).getTime() < new Date().setHours(0,0,0,0)
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors">
      <div className="max-w-2xl w-full mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-colors">
        <div className="p-8 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Todo List</h1>
            {/* Przełącznik dark mode */}
            <button
              onClick={() => setDarkMode(dm => !dm)}
              className="ml-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                // Ikonka słońca
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-yellow-400">
                  <circle cx="12" cy="12" r="5" strokeWidth="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 7.07l-1.41-1.41M6.34 6.34L4.93 4.93m12.02 0l-1.41 1.41M6.34 17.66l-1.41 1.41" />
                </svg>
              ) : (
                // Ikonka księżyca
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-700 dark:text-gray-200">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                </svg>
              )}
            </button>
          </div>
          {/* Podsumowanie na górze */}
          <div className="flex gap-6 mb-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
            <span>All: <span className="font-bold text-gray-800 dark:text-gray-100">{total}</span></span>
            <span>Active: <span className="font-bold text-light-blue-500">{active}</span></span>
            <span>Completed: <span className="font-bold text-green-500">{completed}</span></span>
          </div>
          {/* Przyciski filtrowania */}
          <div className="flex gap-2 mb-6">
            <button
              className={`px-3 py-1 rounded transition-colors text-sm font-medium border ${filter === 'all' ? 'bg-light-blue-500 text-white border-light-blue-500' : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`px-3 py-1 rounded transition-colors text-sm font-medium border ${filter === 'active' ? 'bg-light-blue-500 text-white border-light-blue-500' : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'}`}
              onClick={() => setFilter('active')}
            >
              Active
            </button>
            <button
              className={`px-3 py-1 rounded transition-colors text-sm font-medium border ${filter === 'completed' ? 'bg-light-blue-500 text-white border-light-blue-500' : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'}`}
              onClick={() => setFilter('completed')}
            >
              Completed
            </button>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add new todo..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-light-blue-500 focus:ring-1 focus:ring-light-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <input
              type="date"
              value={newDeadline}
              onChange={e => setNewDeadline(e.target.value)}
              className="px-2 py-2 border rounded-lg focus:outline-none focus:border-light-blue-500 focus:ring-1 focus:ring-light-blue-500 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
            />
            <button
              onClick={addTodo}
              className="px-6 py-2 bg-light-blue-500 text-white rounded-xl hover:bg-white hover:text-light-blue-500 hover:border-light-blue-500 hover:border transition-colors duration-300 hover:scale-105 dark:hover:bg-gray-700 dark:hover:text-light-blue-400"
            >
              Add
            </button>
          </div>
        </div>
        <div className="p-8">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTodos.map(todo => (
              <li
                key={todo.id}
                className={`py-4 flex items-center justify-between group rounded-lg px-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isOverdue(todo) ? 'bg-red-100' : ''}`}
              >
                {/* Tekst zadania z flex-1, żeby zajmował całą szerokość */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    className="w-5 h-5 rounded border-gray-300 text-light-blue-500 focus:ring-light-blue-500"
                  />
                  {editingId === todo.id ? (
                    <input
                      ref={editingInputRef}
                      type="text"
                      value={editingText}
                      onChange={e => setEditingText(e.target.value)}
                      onBlur={submitEdit}
                      onKeyDown={e => {
                        if (e.key === 'Enter') submitEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="text-lg text-gray-800 dark:text-gray-100 px-2 py-1 border-b border-light-blue-500 outline-none bg-gray-50 dark:bg-gray-800 rounded flex-1 min-w-0"
                      style={{ minWidth: 120 }}
                    />
                  ) : (
                    <span className={`text-lg ${todo.completed ? 'line-through text-gray-500 dark:text-gray-500' : isOverdue(todo) ? 'text-red-600' : 'text-gray-800 dark:text-gray-100'} truncate flex-1 min-w-0`}>
                      {todo.text}
                    </span>
                  )}
                  {/* Jeśli jest deadline, pokaż go pod tekstem */}
                  {todo.deadline && (
                    <span className={`block text-xs mt-1 ${isOverdue(todo) ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                      Deadline: {new Date(todo.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {/* Ikonki i Delete w osobnym flex-row */}
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  {/* Ikonka edycji */}
                  <button
                    className="p-0 text-gray-300 hover:text-light-blue-400 transition-colors focus:outline-none"
                    onClick={() => startEditing(todo)}
                    tabIndex={-1}
                    aria-label="Edytuj zadanie"
                    style={{ background: 'none', boxShadow: 'none', border: 'none' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h2v2h2v-2h2v-2h-2v-2h-2v2H9v2z" />
                    </svg>
                  </button>
                  {/* Ikonka info */}
                  <div className="relative flex items-center">
                    <span
                      className="ml-2 cursor-pointer text-light-blue-500 hover:text-light-blue-700 transition-colors"
                      onClick={() => setOpenTooltipId(openTooltipId === todo.id ? null : todo.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01" /></svg>
                    </span>
                    {/* Tooltip tylko po kliknięciu */}
                    {openTooltipId === todo.id && (
                      <div
                        ref={el => {
                          tooltipRefs.current[todo.id] = el;
                        }}
                        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max min-w-[180px] bg-gray-800 text-white text-xs rounded-lg px-4 py-2 z-10 shadow-lg"
                      >
                        <div>Added: {formatDate(new Date(todo.createdAt))}</div>
                        {todo.completedAt && (
                          <div>Zakończono: {formatDate(new Date(todo.completedAt))}</div>
                        )}
                        {todo.deadline && (
                          <div>Deadline: {new Date(todo.deadline).toLocaleDateString()}</div>
                        )}
                        {isOverdue(todo) && !todo.completed && (
                          <div className="text-red-400 font-semibold">After the deadline!</div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Delete jako delikatny link */}
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded focus:outline-none border-none bg-transparent shadow-none"
                    style={{ background: 'none', boxShadow: 'none', border: 'none' }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App
