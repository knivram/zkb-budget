// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from "./0000_lean_white_queen.sql";
import m0001 from "./0001_demonic_colonel_america.sql";
import m0002 from "./0002_fantastic_blonde_phantom.sql";
import journal from "./meta/_journal.json";

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
  },
};
