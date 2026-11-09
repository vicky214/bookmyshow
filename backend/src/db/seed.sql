USE `bookmyshow`;

INSERT IGNORE INTO `cities` (`id`, `name`, `state`, `country`, `slug`) VALUES
('city-mum', 'Mumbai', 'Maharashtra', 'India', 'mumbai'),
('city-del', 'Delhi NCR', 'Delhi', 'India', 'delhi-ncr'),
('city-blr', 'Bengaluru', 'Karnataka', 'India', 'bengaluru');

INSERT IGNORE INTO `cinemas` (`id`, `city_id`, `name`, `address`, `latitude`, `longitude`, `amenities`) VALUES
('cin-01', 'city-mum', 'PVR: Phoenix Palladium, Lower Parel', 'Level 3, High Street Phoenix, 462 Senapati Bapat Marg, Lower Parel, Mumbai 400013', 18.99505500, 72.82563800, '["Parking", "M-Ticket", "Food & Beverage", "Wheelchair Friendly", "Dolby Atmos"]'),
('cin-02', 'city-mum', 'INOX Megaplex: Inorbit Mall, Malad', '4th Floor, Inorbit Mall, Link Road, Malad West, Mumbai 400064', 19.17290000, 72.83620000, '["Parking", "M-Ticket", "IMAX Laser", "Gourmet Menu", "Recliner Seats"]'),
('cin-03', 'city-del', 'PVR Director\\'s Cut: Ambience Mall, Vasant Kunj', 'Nelson Mandela Marg, Vasant Kunj, New Delhi 110070', 28.54010000, 77.15540000, '["Valet Parking", "Luxury Dining", "Dolby Atmos 7.1", "Recliner Loungers"]'),
('cin-04', 'city-blr', 'PVR: Forum Mall, Koramangala', '21, Hosur Rd, Chikku Lakshmaiah Layout, Koramangala, Bengaluru 560095', 12.93450000, 77.61130000, '["Parking", "M-Ticket", "4DX", "Dolby Atmos"]');

INSERT IGNORE INTO `screens` (`id`, `cinema_id`, `name`, `screen_type`, `total_seats`) VALUES
('scr-mum-01', 'cin-01', 'Audi 1 (Dolby Atmos 4K)', 'DOLBY_ATMOS_4K', 40),
('scr-mum-02', 'cin-01', 'Audi 2 (IMAX 3D Laser)', 'IMAX_3D', 40),
('scr-mum-03', 'cin-02', 'Audi 1 (Megaplex Gold Class)', 'GOLD_CLASS', 30),
('scr-del-01', 'cin-03', 'Audi 1 (Director\\'s Luxury)', 'GOLD_CLASS', 30),
('scr-blr-01', 'cin-04', 'Audi 1 (4DX Experience)', '4DX', 40);

INSERT IGNORE INTO `movies` (`id`, `title`, `description`, `language`, `duration_mins`, `genre`, `rating`, `poster_url`, `release_date`) VALUES
('mov-01', 'Dune: Part Two', 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.', 'English', 166, 'Sci-Fi / Adventure', 8.8, 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80', '2024-03-01'),
('mov-02', 'Oppenheimer', 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.', 'English', 180, 'Biography / Drama', 8.9, 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80', '2023-07-21'),
('mov-03', 'Interstellar', 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft along with a team of researchers.', 'English', 169, 'Sci-Fi / Drama', 8.7, 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=80', '2014-11-07'),
('mov-04', 'Kalki 2898 AD', 'A modern-day avatar of Vishnu, a Hindu god, who is believed to have descended to the earth to protect the world from evil forces.', 'Hindi', 181, 'Action / Sci-Fi', 8.2, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80', '2024-06-27');

INSERT IGNORE INTO `partners` (`id`, `partner_name`, `api_key`, `api_secret_hash`, `rate_limit_rpm`, `is_active`) VALUES
('partner-01', 'Google Pay India', 'bms_partner_gpay_live_key_2026', '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b', 600, TRUE),
('partner-02', 'Paytm Entertainment', 'bms_partner_paytm_live_key_2026', 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35', 300, TRUE);
