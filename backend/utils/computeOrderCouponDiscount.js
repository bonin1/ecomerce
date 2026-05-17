/**
 * Helpers for applying storefront coupons to a cart (validated elsewhere).
 */

function normalizeIdArray(val) {
    if (!val) return null;
    const arr = Array.isArray(val) ? val : null;
    if (!arr || arr.length === 0) return null;
    const nums = arr.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
    return nums.length ? nums : null;
}

function lineMatchesCouponScope(product, coupon) {
    const pids = normalizeIdArray(coupon.product_ids);
    const cids = normalizeIdArray(coupon.category_ids);
    if (!pids && !cids) return true;
    if (pids && pids.includes(Number(product.id))) return true;
    if (cids && cids.includes(Number(product.product_category_id))) return true;
    return false;
}

function validateCouponWindow(coupon, now = new Date()) {
    if (!coupon || !coupon.active) {
        return { ok: false, message: 'Invalid or inactive coupon' };
    }
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
        return { ok: false, message: 'Coupon is not active yet' };
    }
    if (coupon.ends_at && new Date(coupon.ends_at) < now) {
        return { ok: false, message: 'Coupon has expired' };
    }
    if (coupon.max_uses != null && Number(coupon.used_count) >= Number(coupon.max_uses)) {
        return { ok: false, message: 'Coupon usage limit reached' };
    }
    return { ok: true };
}

/**
 * @param {object} coupon - Sequelize coupon row
 * @param {{ product: object, itemTotal: number }[]} lines
 */
function computeOrderCouponDiscount(coupon, lines) {
    const scoped =
        (coupon.product_ids && coupon.product_ids.length) ||
        (coupon.category_ids && coupon.category_ids.length);

    let eligibleTotal = 0;
    for (const row of lines) {
        if (lineMatchesCouponScope(row.product, coupon)) {
            eligibleTotal += row.itemTotal;
        }
    }

    if (scoped && eligibleTotal <= 0) {
        return {
            ok: false,
            message: 'This coupon does not apply to the items in your cart',
            discount: 0,
        };
    }

    const base = scoped ? eligibleTotal : lines.reduce((s, r) => s + r.itemTotal, 0);

    let discount = 0;
    if (coupon.discount_type === 'percent') {
        const pct = Number(coupon.discount_value);
        discount = Math.round(((base * pct) / 100) * 100) / 100;
    } else {
        discount = Math.min(Number(coupon.discount_value), base);
    }
    discount = Math.min(Math.max(0, discount), base);
    return { ok: true, discount, base };
}

module.exports = {
    computeOrderCouponDiscount,
    validateCouponWindow,
    lineMatchesCouponScope,
};
