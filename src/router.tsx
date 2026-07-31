import React from 'react'
import { createBrowserRouter, RouterProvider, Outlet, Link } from 'react-router-dom'

function Dashboard() {
  return <div>Welcome to Personal Finance Dashboard</div>
}

function Expenses() {
  return <div>Expenses</div>
}

function Categories() {
  return <div>Categories</div>
}

function Budgets() {
  return <div>Budgets</div>
}

function Reports() {
  return <div>Reports</div>
}

function Layout() {
  return (
    <div>
      <nav aria-label="Primary">
        <ul style={{ display: 'flex', gap: 12, listStyle: 'none', padding: 0 }}>
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/expenses">Expenses</Link></li>
          <li><Link to="/categories">Categories</Link></li>
          <li><Link to="/budgets">Budgets</Link></li>
          <li><Link to="/reports">Reports</Link></li>
        </ul>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'expenses', element: <Expenses /> },
      { path: 'categories', element: <Categories /> },
      { path: 'budgets', element: <Budgets /> },
      { path: 'reports', element: <Reports /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
