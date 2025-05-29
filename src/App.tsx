import { useState, useRef, useEffect } from 'react'

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
}

function formatDate(date: Date) {
  // Formatowanie daty do czytelnej postaci
  return date.toLocaleString();
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [openTooltipId, setOpenTooltipId] = useState<number | null>(null);
  const tooltipRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

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

  const addTodo = () => {
    if (newTodo.trim() === '') return;
    setTodos([
      ...todos,
      {
        id: Date.now(),
        text: newTodo,
        completed: false,
        createdAt: new Date(), // ustawiamy datę utworzenia
      },
    ]);
    setNewTodo('');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-2xl w-full mx-4 bg-white rounded-xl shadow-lg">
        <div className="p-8 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Todo List</h1>
          <div className="flex gap-3">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add new todo..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-light-blue-500 focus:ring-1 focus:ring-light-blue-500"
            />
            <button
              onClick={addTodo}
              className="px-6 py-2 bg-light-blue-500 text-white rounded-xl hover:bg-white hover:text-light-blue-500 hover:border-light-blue-500 hover:border transition-colors duration-300 hover:scale-105"
            >
              Add
            </button>
          </div>
        </div>
        <div className="p-8">
          <ul className="divide-y divide-gray-200">
            {todos.map(todo => (
              <li
                key={todo.id}
                className="py-4 flex items-center justify-between group hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    className="w-5 h-5 rounded border-gray-300 text-light-blue-500 focus:ring-light-blue-500"
                  />
                  <span className={`text-lg ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                    {todo.text}
                  </span>
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
                        <div>Dodano: {formatDate(new Date(todo.createdAt))}</div>
                        {todo.completedAt && (
                          <div>Zakończono: {formatDate(new Date(todo.completedAt))}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 rounded-lg border border-transparent hover:border-red-400 transition duration-200 hover:scale-105 shadow-sm"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App
