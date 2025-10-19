# 🚀 Local Setup Guide

## Quick Setup for Local Development

### 1. Environment Configuration

Create a `.env.local` file in your project root with the following content:

```env
# Database
DATABASE_URL="file:./db/custom.db"

# NextAuth.js Configuration
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production-12345"
NEXTAUTH_URL="http://localhost:3000"

# Optional: For development
NODE_ENV="development"
```

### 2. Database Setup

Run these commands to set up your database:

```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed the database with sample data
npx prisma db seed
```

### 3. Start the Development Server

```bash
npm run dev
```

The application will be available at: `http://localhost:3000`

## 🔑 Default Login Credentials

The system comes with pre-configured users for testing:

### Admin User
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Admin (full access to company management)

### Input Data User
- **Username**: `inputuser`
- **Password**: `admin123`
- **Role**: Input Data (can only enter production data)

### Super Admin User
- **Username**: `superadmin`
- **Password**: `admin123`
- **Role**: Super Admin (cross-company access)

## 📊 Sample Data Included

The database seeding includes:

- **1 Company**: Default Ceramic Company
- **3 Users**: Different roles for testing
- **5 Operators**: Sample production workers
- **3 Clients**: Sample customer companies
- **5 Products**: Sample ceramic items
- **1 Production Order**: Sample order with items
- **Monthly Targets**: For current month

## 🛠️ Troubleshooting

### Authentication Error
If you see `http://localhost:3000/auth/error?error=Configuration`:

1. Make sure `.env.local` file exists in project root
2. Check that `NEXTAUTH_SECRET` is set
3. Verify `NEXTAUTH_URL` matches your local URL
4. Restart the development server after changing env variables

### Database Issues
If database doesn't work:

1. Delete the `db/custom.db` file
2. Run `npx prisma db push` again
3. Run `npx prisma db seed` to populate data

### Port Already in Use
If port 3000 is busy:

1. Stop other processes using port 3000
2. Or change the port in `package.json` and update `NEXTAUTH_URL`

## 🎯 Accessing Features

### Admin Features (use `admin` login):
- **Dashboard**: `/admin/dashboard`
- **Operators Management**: `/admin/operators`
- **Clients Management**: `/admin/clients`
- **Products Management**: `/admin/products`
- **Orders Management**: `/admin/orders`

### Input Data Features (use `inputuser` login):
- **Production Recording**: `/input/record`

### Super Admin Features (use `superadmin` login):
- All admin features plus multi-company management

## 📱 Navigation

After login, you'll be redirected to the dashboard. From there you can:

1. **Manage Master Data**: Add/edit operators, clients, products
2. **Create Orders**: Set up production orders with multiple items
3. **Track Production**: Record daily production results
4. **View Reports**: Analyze performance and quality metrics

## 🔧 Development Notes

- The system uses SQLite for local development
- All CRUD operations include pagination, search, and filtering
- Products have a duplicate feature for quick creation
- Delete operations include confirmation dialogs
- The system includes comprehensive error handling

## 📞 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure database is properly seeded
4. Check that the development server is running

Happy coding! 🎉