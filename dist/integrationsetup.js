"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const fs = require("fs");
const test_helpers_1 = require("./test-helpers");
ava_1.default("Integration test setup", (t) => __awaiter(this, void 0, void 0, function* () {
    // Create DB structure
    yield test_helpers_1.getDbConnection().query(fs.readFileSync(__dirname + "/../db.sql", { encoding: "utf8" }));
    // Insert sample data
    // await client.query(fs.readFileSync("./integration.sql", { encoding: 'utf8' }));
    t.pass();
}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWdyYXRpb25zZXR1cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9pbnRlZ3JhdGlvbnNldHVwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSw2QkFBdUI7QUFJdkIseUJBQXlCO0FBRXpCLGlEQUFpRDtBQUVqRCxhQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBTyxDQUFDLEVBQUUsRUFBRTtJQUN6QyxzQkFBc0I7SUFDdEIsTUFBTSw4QkFBZSxFQUFFLENBQUMsS0FBSyxDQUMzQixFQUFFLENBQUMsWUFBWSxDQUFDLFNBQVMsR0FBRyxZQUFZLEVBQUUsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FDaEUsQ0FBQztJQUVGLHFCQUFxQjtJQUNyQixrRkFBa0Y7SUFFbEYsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ1gsQ0FBQyxDQUFBLENBQUMsQ0FBQyJ9