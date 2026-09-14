import { db } from "./db";

type PaymentModel = typeof db.orm.public.Payment;

type PaymentMethods = keyof PaymentModel;

const method: PaymentMethods = "update";

console.log(method);