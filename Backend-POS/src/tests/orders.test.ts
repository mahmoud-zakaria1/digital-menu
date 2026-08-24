import request from "supertest";
import { app } from "../app.js";
import { describe, beforeEach, it, expect } from "@jest/globals";

describe("Orders API", () => {
  let adminCookie: string;
  let customerCookie: string;
  let mealId: string;

  beforeEach(async () => {
    await request(app).post("/api/users/register").send({
      name: "Admin User",
      email: "admin@test.com",
      phone: "+201234567890",
      password: "password123",
      role: "Admin",
    });

    const adminLogin = await request(app).post("/api/users/login").send({
      email: "admin@test.com",
      password: "password123",
    });

    adminCookie = adminLogin.headers["set-cookie"]?.[0] ?? "";

    await request(app).post("/api/users/register").send({
      name: "Customer User",
      email: "customer@test.com",
      phone: "+201234567891",
      password: "password123",
    });

    const customerLogin = await request(app).post("/api/users/login").send({
      email: "customer@test.com",
      password: "password123",
    });

    customerCookie = customerLogin.headers["set-cookie"]?.[0] ?? "";

    const categoryRes = await request(app)
      .post("/api/categories/")
      .set("Cookie", adminCookie)
      .send({ name: "Burger" });

    const mealRes = await request(app)
      .post("/api/meals/")
      .set("Cookie", adminCookie)
      .send({
        name: "Cheese Burger",
        price: 100,
        category: categoryRes.body.data._id,
      });

    mealId = mealRes.body.data._id;
  });

  it("should calculate totalPrice on the server, ignoring any client-sent value", async () => {
    const res = await request(app)
      .post("/api/orders/")
      .set("Cookie", customerCookie)
      .send({
        meals: [{ meal: mealId, quantity: 3 }],
        phone: "+201234567890",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.totalPrice).toBe(300);
  });

  it("should reject request containing a client-sent totalPrice field", async () => {
    const res = await request(app)
      .post("/api/orders/")
      .set("Cookie", customerCookie)
      .send({
        meals: [{ meal: mealId, quantity: 1 }],
        phone: "+201234567890",
        totalPrice: 1,
      });

    expect(res.status).toBe(400);
  });

  it("should reject invalid status transition (pending -> completed directly)", async () => {
    const orderRes = await request(app)
      .post("/api/orders/")
      .set("Cookie", customerCookie)
      .send({
        meals: [{ meal: mealId, quantity: 1 }],
        phone: "+201234567890",
      });

    const orderId = orderRes.body.data._id;

    const updateRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Cookie", adminCookie)
      .send({ status: "completed" });

    expect(updateRes.status).toBe(400);
  });

  it("should allow valid status transition (pending -> preparing)", async () => {
    const orderRes = await request(app)
      .post("/api/orders/")
      .set("Cookie", customerCookie)
      .send({
        meals: [{ meal: mealId, quantity: 1 }],
        phone: "+201234567890",
      });

    const orderId = orderRes.body.data._id;

    const updateRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Cookie", adminCookie)
      .send({ status: "preparing" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe("preparing");
  });
});
