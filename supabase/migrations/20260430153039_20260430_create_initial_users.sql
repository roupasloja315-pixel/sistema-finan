/*
  # Create Initial Test Users

  1. New Profiles
    - Admin user: admin@tecnocar.com (role: admin)
    - Regular user: usuario@tecnocar.com (role: user)
  
  2. Credentials
    - admin@tecnocar.com / Admin@123456
    - usuario@tecnocar.com / Usuario@123456
*/

INSERT INTO public.profiles (id, email, role)
VALUES
  ('a445cc4a-a0eb-42a0-b65e-071c759deaeb', 'admin@tecnocar.com', 'admin'),
  ('2b07894d-9200-4eb5-945e-492026ec9732', 'usuario@tecnocar.com', 'user')
ON CONFLICT DO NOTHING;
