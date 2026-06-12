import React from 'react';

const AdminDashboard = () => {
  return (
    <div className="admin-container">
      <h2>Admin/Moderator Dashboard</h2>

      <div className="admin-sections-grid">
        <section className="moderation-reports-card">
          <h3>Pending Flagged Content</h3>
          <table className="reports-table">
            <thead>
              <tr>
                <th>Reporter</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Jane Doe</td>
                <td>Answer</td>
                <td>Offensive</td>
                <td>"Insulting language in CS401 reply..."</td>
                <td>
                  <button className="btn btn-primary btn-sm">Resolve</button>
                  <button className="btn btn-secondary btn-sm">Dismiss</button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="category-crud-card">
          <h3>Manage Categories</h3>
          <form className="category-form">
            <div className="form-group">
              <label>Category Name</label>
              <input type="text" placeholder="Academics" />
            </div>
            <div className="form-group">
              <label>Slug</label>
              <input type="text" placeholder="academics" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea placeholder="Category summary..."></textarea>
            </div>
            <button type="submit" className="btn btn-primary">Create Category</button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
