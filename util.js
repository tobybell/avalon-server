
// Method: Math.randomInt (int limit)
// Returns a random integer between 0 inclusive and limit exclusive.
if (!Math.randomInt) {
    Math.randomInt = function (limit) {
        return Math.floor(Math.random() * limit)
    }
}

// Method: Array.shuffle
// Arranges the elements of the called array into random order.
if (!Array.prototype.shuffle) {
    Array.prototype.shuffle = function () {
        // For each index in the array,
        for (let i = this.length - 1; i >= 0; i -= 1) {
            // Generate a random index less than or equal to it,
            const r = Math.randomInt(i + 1)
            // And swap it with the current index.
            const t = this[i]
            this[i] = this[r]
            this[r] = t
        }
    }
}

// Method: Array.shuffled
// Returns a new array containing the elements of the called array in random
// order.
if (!Array.prototype.shuffled) {
    Array.prototype.shuffled = function () {
        const that = []
        for (let i = 0; i < this.length; i += 1) that.push(this[i])
        that.shuffle()
        return that
    }
}

// Method: Array.count
// Returns the number of elements in the array matching a given predicate.
if (!Array.prototype.count) {
    Array.prototype.count = function(pred) {
        let c = 0
        for (let i = 0; i < this.length; i += 1)
            if (pred(this[i])) c += 1
        return c
    }
}
