#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, vec, Address, Env, Vec};

#[contracttype]
#[derive(Clone)]
pub struct Payment {
    pub sender: Address,
    pub recipient: Address,
    pub amount: i128,
    pub timestamp: u64,
}

#[contracttype]
pub enum DataKey {
    Payments(Address),
}

#[contract]
pub struct PaymentTracker;

#[contractimpl]
impl PaymentTracker {
    pub fn record_payment(env: Env, sender: Address, recipient: Address, amount: i128) {
        sender.require_auth();

        let key = DataKey::Payments(sender.clone());
        let mut payments: Vec<Payment> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(vec![&env]);

        let payment = Payment {
            sender,
            recipient,
            amount,
            timestamp: env.ledger().timestamp(),
        };

        payments.push_back(payment);
        env.storage().persistent().set(&key, &payments);
    }

    pub fn get_payments(env: Env, sender: Address) -> Vec<Payment> {
        let key = DataKey::Payments(sender);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or(vec![&env])
    }
}
