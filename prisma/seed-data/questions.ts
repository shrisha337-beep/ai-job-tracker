/**
 * Seed DSA practice questions (MG1).
 *
 * Classic interview problems, written in our own words. Each question has a
 * rubric used by the grader (A3) at temperature 0:
 *   correctness -> `criteria`, complexity -> `time`/`space`, edgeCases -> `edgeCases`.
 *
 * companyTags are illustrative, based on public interview-experience posts;
 * they are hints for practice, not claims about any company's question bank.
 * Topic ids must match `dsaTopics` in src/data/taxonomy.json (enforced by tests).
 */

export type SeedDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface Rubric {
  /** The expected optimal approach in one line */
  approach: string;
  /** Optimal time complexity */
  time: string;
  /** Optimal extra space complexity */
  space: string;
  /** What a correct answer must do */
  criteria: string[];
  /** Edge cases a complete answer should handle */
  edgeCases: string[];
}

export interface SeedQuestion {
  slug: string;
  topic: string;
  difficulty: SeedDifficulty;
  title: string;
  prompt: string;
  rubric: Rubric;
  companyTags: string[];
}

export const questions: SeedQuestion[] = [
  // ---------------------------------------------------------------- arrays (8)
  {
    slug: "arrays-pair-sum-sorted",
    topic: "arrays",
    difficulty: "EASY",
    title: "Pair with target sum in a sorted array",
    prompt:
      "Given an array of integers sorted in non-decreasing order and a target, return the 0-based indices of two different elements that add up to the target, or [-1, -1] if no such pair exists.",
    rubric: {
      approach: "Two pointers from both ends, move left up if sum is small, right down if large",
      time: "O(n)",
      space: "O(1)",
      criteria: ["Uses the sorted order instead of nested loops", "Never pairs an element with itself", "Returns [-1, -1] when no pair exists"],
      edgeCases: ["Empty or single-element array", "Duplicate values", "Negative numbers"],
    },
    companyTags: ["Amazon", "TCS"],
  },
  {
    slug: "arrays-move-zeroes",
    topic: "arrays",
    difficulty: "EASY",
    title: "Move zeroes to the end",
    prompt:
      "Rearrange an integer array in place so that all zeroes move to the end while the relative order of the non-zero elements is kept.",
    rubric: {
      approach: "Write pointer for the next non-zero slot, then fill the rest with zeroes (or swap)",
      time: "O(n)",
      space: "O(1)",
      criteria: ["Works in place", "Keeps the order of non-zero elements", "Single or two linear passes"],
      edgeCases: ["All zeroes", "No zeroes", "Single element"],
    },
    companyTags: ["Infosys", "Zoho"],
  },
  {
    slug: "arrays-best-time-stock",
    topic: "arrays",
    difficulty: "EASY",
    title: "Best day to buy and sell once",
    prompt:
      "prices[i] is a stock's price on day i. You may buy once and sell once on a later day. Return the maximum profit, or 0 if no profit is possible.",
    rubric: {
      approach: "Track the minimum price so far and the best price minus minimum",
      time: "O(n)",
      space: "O(1)",
      criteria: ["Sells only after buying", "Returns 0 for strictly falling prices", "Single pass"],
      edgeCases: ["Empty array", "One day", "All prices equal"],
    },
    companyTags: ["Goldman Sachs", "Amazon"],
  },
  {
    slug: "arrays-max-subarray-sum",
    topic: "arrays",
    difficulty: "MEDIUM",
    title: "Maximum subarray sum",
    prompt: "Return the largest sum of any non-empty contiguous subarray of an integer array.",
    rubric: {
      approach: "Kadane's algorithm: best ending here = max(x, best ending before + x)",
      time: "O(n)",
      space: "O(1)",
      criteria: ["Considers only contiguous subarrays", "Handles all-negative input by returning the largest element", "Linear time"],
      edgeCases: ["All negative numbers", "Single element", "Large values (overflow awareness)"],
    },
    companyTags: ["Microsoft", "Flipkart"],
  },
  {
    slug: "arrays-merge-intervals",
    topic: "arrays",
    difficulty: "MEDIUM",
    title: "Merge overlapping intervals",
    prompt:
      "Given a list of [start, end] intervals, merge every set of overlapping intervals and return the result sorted by start.",
    rubric: {
      approach: "Sort by start, then extend the last merged interval or start a new one",
      time: "O(n log n)",
      space: "O(n) for output",
      criteria: ["Sorts before merging", "Treats touching intervals ([1,3],[3,5]) as overlapping", "Updates end with max, not the new end"],
      edgeCases: ["Empty list", "One interval contains another", "Already disjoint intervals"],
    },
    companyTags: ["Google", "Uber"],
  },
  {
    slug: "arrays-product-except-self",
    topic: "arrays",
    difficulty: "MEDIUM",
    title: "Product of all other elements",
    prompt:
      "Return an array where output[i] is the product of every element except nums[i], without using division.",
    rubric: {
      approach: "Prefix products left to right, then multiply by suffix products right to left",
      time: "O(n)",
      space: "O(1) extra besides output",
      criteria: ["Does not use division", "Two linear passes", "Correct with one or more zeroes"],
      edgeCases: ["One zero", "Multiple zeroes", "Negative numbers"],
    },
    companyTags: ["Amazon", "Atlassian"],
  },
  {
    slug: "arrays-container-most-water",
    topic: "arrays",
    difficulty: "MEDIUM",
    title: "Container with most water",
    prompt:
      "heights[i] is the height of a vertical line at x = i. Pick two lines that, with the x-axis, hold the most water. Return that maximum area.",
    rubric: {
      approach: "Two pointers; always move the shorter line inward",
      time: "O(n)",
      space: "O(1)",
      criteria: ["Area = min(h[l], h[r]) * (r - l)", "Justifies moving the shorter side", "Linear time"],
      edgeCases: ["Two lines only", "All equal heights", "Zero heights"],
    },
    companyTags: ["Adobe", "Walmart Global Tech"],
  },
  {
    slug: "arrays-trapping-rain-water",
    topic: "arrays",
    difficulty: "HARD",
    title: "Trapping rain water",
    prompt:
      "Given non-negative bar heights of width 1, compute how many units of water are trapped after it rains.",
    rubric: {
      approach: "Two pointers with running leftMax and rightMax (or prefix/suffix max arrays)",
      time: "O(n)",
      space: "O(1) with two pointers",
      criteria: ["Water at i = min(leftMax, rightMax) - height[i]", "Never counts negative water", "Linear time"],
      edgeCases: ["Fewer than 3 bars", "Strictly increasing or decreasing heights", "Flat plateau"],
    },
    companyTags: ["Google", "Goldman Sachs"],
  },

  // --------------------------------------------------------------- strings (8)
  {
    slug: "strings-valid-palindrome",
    topic: "strings",
    difficulty: "EASY",
    title: "Palindrome ignoring non-alphanumerics",
    prompt:
      "Return true if a string reads the same forwards and backwards after lower-casing it and removing all non-alphanumeric characters.",
    rubric: {
      approach: "Two pointers skipping non-alphanumeric characters, compare lower-cased",
      time: "O(n)",
      space: "O(1)",
      criteria: ["Ignores case", "Skips punctuation and spaces", "Does not build unnecessary copies (bonus)"],
      edgeCases: ["Empty string", "Only punctuation", "Digits mixed with letters"],
    },
    companyTags: ["Infosys", "Zoho"],
  },
  {
    slug: "strings-anagram-check",
    topic: "strings",
    difficulty: "EASY",
    title: "Check if two strings are anagrams",
    prompt: "Return true if string t is a rearrangement of the letters of string s.",
    rubric: {
      approach: "Count characters with a fixed-size array or hash map and compare",
      time: "O(n)",
      space: "O(1) for a fixed alphabet",
      criteria: ["Checks lengths first", "Counts frequencies rather than sorting (sorting is acceptable but slower)", "Correct for repeated letters"],
      edgeCases: ["Different lengths", "Empty strings", "Unicode or uppercase (discussed)"],
    },
    companyTags: ["TCS", "Amazon"],
  },
  {
    slug: "strings-reverse-words",
    topic: "strings",
    difficulty: "EASY",
    title: "Reverse the words in a sentence",
    prompt:
      "Reverse the order of words in a string. Words are separated by one or more spaces; the output should have single spaces and no leading or trailing spaces.",
    rubric: {
      approach: "Split on whitespace, drop empties, reverse, join (or reverse whole string then each word)",
      time: "O(n)",
      space: "O(n)",
      criteria: ["Collapses multiple spaces", "Trims leading and trailing spaces", "Keeps characters within each word in order"],
      edgeCases: ["Only spaces", "Single word", "Multiple spaces between words"],
    },
    companyTags: ["Wipro", "Microsoft"],
  },
  {
    slug: "strings-string-compression",
    topic: "strings",
    difficulty: "EASY",
    title: "Run-length string compression",
    prompt:
      "Compress a string by replacing runs of the same character with the character followed by the run length (\"aaabcc\" -> \"a3b1c2\"). Return the original string if the compressed one is not shorter.",
    rubric: {
      approach: "Single pass counting runs, build output with a string builder",
      time: "O(n)",
      space: "O(n)",
      criteria: ["Counts runs correctly including the last run", "Returns original when not shorter", "Uses a builder, not repeated string concatenation"],
      edgeCases: ["Empty string", "Run length of 10 or more", "No repeated characters"],
    },
    companyTags: ["Zoho", "Accenture"],
  },
  {
    slug: "strings-longest-substring-no-repeat",
    topic: "strings",
    difficulty: "MEDIUM",
    title: "Longest substring without repeating characters",
    prompt: "Return the length of the longest substring that contains no repeated characters.",
    rubric: {
      approach: "Sliding window with last-seen index map; jump left past the previous occurrence",
      time: "O(n)",
      space: "O(min(n, alphabet))",
      criteria: ["Window never contains duplicates", "Left pointer never moves backwards", "Linear time"],
      edgeCases: ["Empty string", "All same characters", "All distinct characters"],
    },
    companyTags: ["Amazon", "Swiggy"],
  },
  {
    slug: "strings-longest-palindromic-substring",
    topic: "strings",
    difficulty: "MEDIUM",
    title: "Longest palindromic substring",
    prompt: "Return the longest substring of s that is a palindrome.",
    rubric: {
      approach: "Expand around each of the 2n-1 centres",
      time: "O(n^2)",
      space: "O(1)",
      criteria: ["Handles both odd and even length palindromes", "Returns the substring, not just the length", "Better than O(n^3)"],
      edgeCases: ["Single character", "Whole string is a palindrome", "No repeated characters"],
    },
    companyTags: ["Microsoft", "Oracle"],
  },
  {
    slug: "strings-group-anagrams",
    topic: "strings",
    difficulty: "MEDIUM",
    title: "Group anagrams together",
    prompt: "Given a list of words, group the words that are anagrams of each other. Order of groups does not matter.",
    rubric: {
      approach: "Hash map keyed by sorted word or a 26-count signature",
      time: "O(n * k log k) or O(n * k)",
      space: "O(n * k)",
      criteria: ["Uses a canonical key per anagram class", "Every word appears in exactly one group", "Avoids pairwise comparisons"],
      edgeCases: ["Empty strings", "Single word", "Duplicate words"],
    },
    companyTags: ["Amazon", "Salesforce"],
  },
  {
    slug: "strings-min-window-substring",
    topic: "strings",
    difficulty: "HARD",
    title: "Minimum window containing all characters",
    prompt:
      "Given strings s and t, return the shortest substring of s that contains every character of t (including duplicates), or an empty string if none exists.",
    rubric: {
      approach: "Sliding window with need counts and a 'formed' counter; shrink from the left when valid",
      time: "O(|s| + |t|)",
      space: "O(alphabet)",
      criteria: ["Respects duplicate characters in t", "Shrinks the window greedily once valid", "Linear time"],
      edgeCases: ["t longer than s", "No valid window", "t has repeated characters"],
    },
    companyTags: ["Google", "Uber"],
  },

  // ---------------------------------------------------------- linked-lists (7)
  {
    slug: "ll-reverse-list",
    topic: "linked-lists",
    difficulty: "EASY",
    title: "Reverse a singly linked list",
    prompt: "Reverse a singly linked list and return the new head.",
    rubric: {
      approach: "Iterate with prev/curr/next pointers (recursion also acceptable)",
      time: "O(n)",
      space: "O(1) iterative",
      criteria: ["Saves next before rewiring", "Returns the old tail as new head", "No lost nodes"],
      edgeCases: ["Empty list", "Single node", "Two nodes"],
    },
    companyTags: ["TCS", "Amazon"],
  },
  {
    slug: "ll-detect-cycle",
    topic: "linked-lists",
    difficulty: "EASY",
    title: "Detect a cycle in a linked list",
    prompt: "Return true if a singly linked list contains a cycle.",
    rubric: {
      approach: "Floyd's slow and fast pointers",
      time: "O(n)",
      space: "O(1)",
      criteria: ["Fast moves two steps, slow one", "Checks fast and fast.next for null", "Constant extra space (hash set is a weaker answer)"],
      edgeCases: ["Empty list", "Single node pointing to itself", "Cycle at the head"],
    },
    companyTags: ["Microsoft", "Adobe"],
  },
  {
    slug: "ll-merge-two-sorted",
    topic: "linked-lists",
    difficulty: "EASY",
    title: "Merge two sorted linked lists",
    prompt: "Merge two sorted linked lists into one sorted list by splicing their nodes together.",
    rubric: {
      approach: "Dummy head and a tail pointer, attach the smaller node each step",
      time: "O(n + m)",
      space: "O(1)",
      criteria: ["Reuses existing nodes", "Attaches the remaining list at the end", "Stable for equal values"],
      edgeCases: ["One or both lists empty", "Lists of very different lengths", "Equal values"],
    },
    companyTags: ["Amazon", "Infosys"],
  },
  {
    slug: "ll-remove-nth-from-end",
    topic: "linked-lists",
    difficulty: "MEDIUM",
    title: "Remove the n-th node from the end",
    prompt: "Remove the n-th node from the end of a linked list in one pass and return the head.",
    rubric: {
      approach: "Dummy node, advance fast n+1 steps, then move both until fast is null",
      time: "O(n)",
      space: "O(1)",
      criteria: ["Single pass", "Uses a dummy node to handle removing the head", "Correct gap between pointers"],
      edgeCases: ["Removing the head", "Single-node list", "n equals list length"],
    },
    companyTags: ["Flipkart", "Walmart Global Tech"],
  },
  {
    slug: "ll-add-two-numbers",
    topic: "linked-lists",
    difficulty: "MEDIUM",
    title: "Add two numbers stored as linked lists",
    prompt:
      "Two non-negative numbers are stored in linked lists with digits in reverse order. Return their sum as a linked list in the same format.",
    rubric: {
      approach: "Walk both lists with a carry, creating nodes for each digit",
      time: "O(max(n, m))",
      space: "O(max(n, m)) for output",
      criteria: ["Propagates carry", "Handles lists of different lengths", "Adds a final node for leftover carry"],
      edgeCases: ["Final carry (999 + 1)", "One list is zero", "Different lengths"],
    },
    companyTags: ["Microsoft", "Amazon"],
  },
  {
    slug: "ll-lru-cache",
    topic: "linked-lists",
    difficulty: "MEDIUM",
    title: "Design an LRU cache",
    prompt:
      "Design a cache with a fixed capacity supporting get(key) and put(key, value) in O(1). When full, evict the least recently used key.",
    rubric: {
      approach: "Hash map from key to node in a doubly linked list ordered by recency",
      time: "O(1) per operation",
      space: "O(capacity)",
      criteria: ["get moves the node to most-recent", "put updates existing keys and evicts the tail when full", "Both operations O(1)"],
      edgeCases: ["Capacity 1", "Updating an existing key", "get on a missing key"],
    },
    companyTags: ["Amazon", "Flipkart", "Swiggy"],
  },
  {
    slug: "ll-reverse-k-group",
    topic: "linked-lists",
    difficulty: "HARD",
    title: "Reverse nodes in groups of k",
    prompt:
      "Reverse the nodes of a linked list k at a time. If the remaining nodes are fewer than k, leave them as they are.",
    rubric: {
      approach: "Check k nodes exist, reverse that segment, reconnect, move to the next group",
      time: "O(n)",
      space: "O(1) iterative",
      criteria: ["Leaves a short final group untouched", "Reconnects segments correctly", "Only changes links, not values"],
      edgeCases: ["k = 1", "k equals list length", "Length not a multiple of k"],
    },
    companyTags: ["Microsoft", "Adobe"],
  },

  // ----------------------------------------------------------------- trees (8)
  {
    slug: "trees-max-depth",
    topic: "trees",
    difficulty: "EASY",
    title: "Maximum depth of a binary tree",
    prompt: "Return the number of nodes on the longest path from the root down to a leaf.",
    rubric: {
      approach: "Recursive 1 + max(depth(left), depth(right)) or BFS by level",
      time: "O(n)",
      space: "O(h)",
      criteria: ["Returns 0 for an empty tree", "Visits each node once", "Correct base case"],
      edgeCases: ["Empty tree", "Skewed tree (recursion depth)", "Single node"],
    },
    companyTags: ["TCS", "Amazon"],
  },
  {
    slug: "trees-invert",
    topic: "trees",
    difficulty: "EASY",
    title: "Mirror a binary tree",
    prompt: "Invert a binary tree so that every node's left and right children are swapped. Return the root.",
    rubric: {
      approach: "Recursively swap children (or BFS with a queue)",
      time: "O(n)",
      space: "O(h)",
      criteria: ["Swaps at every node", "Returns the root", "Handles null children"],
      edgeCases: ["Empty tree", "Single node", "Only left children"],
    },
    companyTags: ["Google", "Zoho"],
  },
  {
    slug: "trees-level-order",
    topic: "trees",
    difficulty: "MEDIUM",
    title: "Level-order traversal",
    prompt: "Return the values of a binary tree level by level, left to right, as a list of lists.",
    rubric: {
      approach: "BFS with a queue, processing one level's size at a time",
      time: "O(n)",
      space: "O(w) where w is max width",
      criteria: ["Groups values by level", "Left-to-right order within a level", "Uses a queue, not recursion depth tricks only"],
      edgeCases: ["Empty tree", "Unbalanced tree", "Single node"],
    },
    companyTags: ["Amazon", "Microsoft"],
  },
  {
    slug: "trees-validate-bst",
    topic: "trees",
    difficulty: "MEDIUM",
    title: "Validate a binary search tree",
    prompt:
      "Return true if a binary tree is a valid BST: every node's left subtree holds smaller values and its right subtree holds larger values.",
    rubric: {
      approach: "Recurse with (low, high) bounds, or check in-order traversal is strictly increasing",
      time: "O(n)",
      space: "O(h)",
      criteria: ["Checks the whole subtree, not only direct children", "Treats duplicates per the stated rule", "Bounds avoid integer overflow issues"],
      edgeCases: ["Node equal to an ancestor", "Values at integer limits", "Empty tree"],
    },
    companyTags: ["Amazon", "Goldman Sachs"],
  },
  {
    slug: "trees-lca-bst",
    topic: "trees",
    difficulty: "MEDIUM",
    title: "Lowest common ancestor in a BST",
    prompt: "Given a BST and two nodes p and q in it, return their lowest common ancestor.",
    rubric: {
      approach: "Walk from root: go left if both smaller, right if both larger, else current node",
      time: "O(h)",
      space: "O(1) iterative",
      criteria: ["Uses BST ordering instead of searching both subtrees", "Handles a node being its own ancestor", "Stops at the split point"],
      edgeCases: ["p is ancestor of q", "p equals q", "Skewed tree"],
    },
    companyTags: ["Microsoft", "Intuit"],
  },
  {
    slug: "trees-diameter",
    topic: "trees",
    difficulty: "MEDIUM",
    title: "Diameter of a binary tree",
    prompt: "Return the number of edges on the longest path between any two nodes in a binary tree.",
    rubric: {
      approach: "Post-order height computation, updating best = max(best, leftH + rightH)",
      time: "O(n)",
      space: "O(h)",
      criteria: ["Path may not pass through the root", "Single traversal (not height recomputed per node)", "Counts edges, not nodes"],
      edgeCases: ["Empty tree", "Single node (diameter 0)", "Longest path in one subtree"],
    },
    companyTags: ["Amazon", "Uber"],
  },
  {
    slug: "trees-kth-smallest-bst",
    topic: "trees",
    difficulty: "MEDIUM",
    title: "K-th smallest element in a BST",
    prompt: "Return the k-th smallest value (1-indexed) in a binary search tree.",
    rubric: {
      approach: "In-order traversal with a counter, stopping early",
      time: "O(h + k)",
      space: "O(h)",
      criteria: ["Uses in-order to get sorted order", "Stops after k nodes", "Does not collect the whole tree unnecessarily"],
      edgeCases: ["k = 1", "k = number of nodes", "Skewed tree"],
    },
    companyTags: ["Adobe", "Salesforce"],
  },
  {
    slug: "trees-serialize-deserialize",
    topic: "trees",
    difficulty: "HARD",
    title: "Serialize and deserialize a binary tree",
    prompt:
      "Design functions that convert a binary tree to a string and back, so that deserialize(serialize(root)) recreates the same tree.",
    rubric: {
      approach: "Pre-order (or BFS) with explicit null markers, rebuild with an iterator/queue",
      time: "O(n)",
      space: "O(n)",
      criteria: ["Encodes nulls so structure is unambiguous", "Round-trips any tree", "Handles negative and multi-digit values"],
      edgeCases: ["Empty tree", "Negative values", "Skewed tree"],
    },
    companyTags: ["Google", "Microsoft"],
  },

  // ---------------------------------------------------------------- graphs (7)
  {
    slug: "graphs-bfs-shortest-path",
    topic: "graphs",
    difficulty: "EASY",
    title: "Shortest path in an unweighted graph",
    prompt:
      "Given an undirected graph as an adjacency list and nodes src and dst, return the fewest edges on a path from src to dst, or -1 if unreachable.",
    rubric: {
      approach: "BFS from src with a visited set and distance per node",
      time: "O(V + E)",
      space: "O(V)",
      criteria: ["Uses BFS (not DFS) for shortest path", "Marks visited when enqueued", "Returns -1 when unreachable"],
      edgeCases: ["src equals dst", "Disconnected graph", "Self-loops"],
    },
    companyTags: ["Uber", "Amazon"],
  },
  {
    slug: "graphs-number-of-islands",
    topic: "graphs",
    difficulty: "MEDIUM",
    title: "Count islands in a grid",
    prompt:
      "In a 2D grid of '1' (land) and '0' (water), count islands. Land cells connect horizontally or vertically.",
    rubric: {
      approach: "Scan cells; on unvisited land, flood fill with DFS/BFS and count",
      time: "O(rows * cols)",
      space: "O(rows * cols) worst case",
      criteria: ["Only 4-directional neighbours", "Each cell visited once", "Bounds checks"],
      edgeCases: ["Empty grid", "All water", "One big island"],
    },
    companyTags: ["Amazon", "Microsoft", "Flipkart"],
  },
  {
    slug: "graphs-course-schedule",
    topic: "graphs",
    difficulty: "MEDIUM",
    title: "Can all courses be finished?",
    prompt:
      "There are n courses and a list of prerequisite pairs [a, b] meaning b must be taken before a. Return true if every course can be completed.",
    rubric: {
      approach: "Detect a cycle with Kahn's topological sort (in-degrees) or DFS colouring",
      time: "O(V + E)",
      space: "O(V + E)",
      criteria: ["Builds a directed graph with the right edge direction", "Correctly detects cycles", "Handles disconnected components"],
      edgeCases: ["No prerequisites", "Self-dependency", "Multiple components"],
    },
    companyTags: ["Google", "Atlassian"],
  },
  {
    slug: "graphs-rotting-oranges",
    topic: "graphs",
    difficulty: "MEDIUM",
    title: "Minutes until all oranges rot",
    prompt:
      "In a grid, 0 is empty, 1 is a fresh orange, 2 is rotten. Each minute, fresh oranges next to rotten ones rot. Return the minutes until none are fresh, or -1 if impossible.",
    rubric: {
      approach: "Multi-source BFS starting from all rotten oranges, level by level",
      time: "O(rows * cols)",
      space: "O(rows * cols)",
      criteria: ["Starts BFS from all rotten cells at once", "Counts levels as minutes", "Returns -1 if fresh oranges remain"],
      edgeCases: ["No fresh oranges (answer 0)", "No rotten oranges", "Isolated fresh orange"],
    },
    companyTags: ["Amazon", "Walmart Global Tech"],
  },
  {
    slug: "graphs-clone-graph",
    topic: "graphs",
    difficulty: "MEDIUM",
    title: "Deep-copy a graph",
    prompt: "Given a node in a connected undirected graph, return a deep copy of the whole graph.",
    rubric: {
      approach: "DFS/BFS with a map from original node to its clone",
      time: "O(V + E)",
      space: "O(V)",
      criteria: ["Each node cloned exactly once", "Neighbour lists point to clones", "Handles cycles via the map"],
      edgeCases: ["Null input", "Single node with no neighbours", "Cycles"],
    },
    companyTags: ["Microsoft", "Salesforce"],
  },
  {
    slug: "graphs-network-delay-dijkstra",
    topic: "graphs",
    difficulty: "HARD",
    title: "Time for a signal to reach every node",
    prompt:
      "A network has n nodes and directed weighted edges (u, v, w). A signal starts at node k. Return the time for all nodes to receive it, or -1 if some never do.",
    rubric: {
      approach: "Dijkstra with a min-heap, answer is the max shortest distance",
      time: "O(E log V)",
      space: "O(V + E)",
      criteria: ["Uses a priority queue", "Skips stale heap entries", "Returns -1 if any node is unreachable"],
      edgeCases: ["Unreachable node", "Multiple edges between the same pair", "Single node"],
    },
    companyTags: ["Google", "Uber"],
  },
  {
    slug: "graphs-word-ladder",
    topic: "graphs",
    difficulty: "HARD",
    title: "Shortest word transformation",
    prompt:
      "Given beginWord, endWord and a word list, return the number of words in the shortest sequence from beginWord to endWord where each step changes one letter and every intermediate word is in the list. Return 0 if impossible.",
    rubric: {
      approach: "BFS over words, generating neighbours by wildcard patterns or letter substitution",
      time: "O(N * L^2) with pattern buckets",
      space: "O(N * L)",
      criteria: ["Models words as graph nodes", "Uses BFS for the shortest sequence", "Removes or marks visited words"],
      edgeCases: ["endWord not in list", "beginWord equals endWord", "No path"],
    },
    companyTags: ["Amazon", "Microsoft"],
  },

  // --------------------------------------------------- dynamic-programming (8)
  {
    slug: "dp-climbing-stairs",
    topic: "dynamic-programming",
    difficulty: "EASY",
    title: "Ways to climb stairs",
    prompt: "You can climb 1 or 2 steps at a time. In how many distinct ways can you reach step n?",
    rubric: {
      approach: "ways(n) = ways(n-1) + ways(n-2) with two rolling variables",
      time: "O(n)",
      space: "O(1)",
      criteria: ["Identifies the recurrence", "Avoids exponential recursion", "Correct base cases"],
      edgeCases: ["n = 0 or 1", "Large n (overflow discussion)"],
    },
    companyTags: ["Amazon", "TCS"],
  },
  {
    slug: "dp-house-robber",
    topic: "dynamic-programming",
    difficulty: "MEDIUM",
    title: "Maximum loot without adjacent houses",
    prompt:
      "Each house has some money. You cannot rob two adjacent houses. Return the maximum amount you can rob.",
    rubric: {
      approach: "best(i) = max(best(i-1), best(i-2) + nums[i]) with rolling variables",
      time: "O(n)",
      space: "O(1)",
      criteria: ["Correct recurrence", "Never picks adjacent houses", "Constant space (bonus)"],
      edgeCases: ["Empty array", "One house", "Two houses"],
    },
    companyTags: ["Flipkart", "Microsoft"],
  },
  {
    slug: "dp-coin-change",
    topic: "dynamic-programming",
    difficulty: "MEDIUM",
    title: "Fewest coins to make an amount",
    prompt:
      "Given coin denominations (unlimited supply) and an amount, return the fewest coins needed to make the amount, or -1 if it cannot be made.",
    rubric: {
      approach: "Bottom-up dp[a] = min over coins of dp[a - c] + 1",
      time: "O(amount * coins)",
      space: "O(amount)",
      criteria: ["Explains why greedy fails", "Initialises unreachable states to infinity", "Returns -1 when unreachable"],
      edgeCases: ["amount = 0", "No combination works", "Single coin type"],
    },
    companyTags: ["Amazon", "Goldman Sachs"],
  },
  {
    slug: "dp-longest-increasing-subsequence",
    topic: "dynamic-programming",
    difficulty: "MEDIUM",
    title: "Longest increasing subsequence",
    prompt: "Return the length of the longest strictly increasing subsequence of an integer array.",
    rubric: {
      approach: "O(n^2) DP, or patience sorting with binary search for O(n log n)",
      time: "O(n log n) optimal",
      space: "O(n)",
      criteria: ["Subsequence, not subarray", "Strictly increasing", "Mentions or implements O(n log n)"],
      edgeCases: ["All equal values", "Strictly decreasing array", "Single element"],
    },
    companyTags: ["Google", "Adobe"],
  },
  {
    slug: "dp-longest-common-subsequence",
    topic: "dynamic-programming",
    difficulty: "MEDIUM",
    title: "Longest common subsequence",
    prompt: "Return the length of the longest subsequence common to two strings.",
    rubric: {
      approach: "2D DP: match -> dp[i-1][j-1] + 1, else max(dp[i-1][j], dp[i][j-1])",
      time: "O(n * m)",
      space: "O(min(n, m)) with rolling rows",
      criteria: ["Correct transition", "Proper base row and column", "Space optimisation discussed"],
      edgeCases: ["One empty string", "Identical strings", "No common characters"],
    },
    companyTags: ["Microsoft", "Oracle"],
  },
  {
    slug: "dp-knapsack-01",
    topic: "dynamic-programming",
    difficulty: "MEDIUM",
    title: "0/1 knapsack",
    prompt:
      "Given item weights and values and a capacity W, choose items (each at most once) to maximise total value without exceeding W.",
    rubric: {
      approach: "dp[w] over capacity, iterating w downwards per item",
      time: "O(n * W)",
      space: "O(W)",
      criteria: ["Each item used at most once", "Iterates capacity in reverse for 1D DP", "Correct base case"],
      edgeCases: ["Capacity 0", "Item heavier than capacity", "No items"],
    },
    companyTags: ["Infosys", "Amazon"],
  },
  {
    slug: "dp-partition-equal-subset",
    topic: "dynamic-programming",
    difficulty: "MEDIUM",
    title: "Split into two equal-sum subsets",
    prompt: "Return true if an array of positive integers can be split into two subsets with equal sums.",
    rubric: {
      approach: "If total is odd return false; else subset-sum DP for total/2",
      time: "O(n * sum)",
      space: "O(sum)",
      criteria: ["Odd total check", "Reduces to subset sum", "Reverse iteration for 1D DP"],
      edgeCases: ["Single element", "Odd total", "Element larger than half"],
    },
    companyTags: ["Amazon", "Walmart Global Tech"],
  },
  {
    slug: "dp-edit-distance",
    topic: "dynamic-programming",
    difficulty: "HARD",
    title: "Edit distance",
    prompt:
      "Return the minimum number of single-character insertions, deletions or replacements needed to turn word1 into word2.",
    rubric: {
      approach: "2D DP: equal chars -> diagonal, else 1 + min(insert, delete, replace)",
      time: "O(n * m)",
      space: "O(min(n, m)) with rolling rows",
      criteria: ["All three operations considered", "Base cases are i and j (cost of deleting/inserting)", "Correct when characters match"],
      edgeCases: ["One empty string", "Identical strings", "Completely different strings"],
    },
    companyTags: ["Google", "Microsoft"],
  },

  // ------------------------------------------------------------- recursion (7)
  {
    slug: "rec-power-function",
    topic: "recursion",
    difficulty: "EASY",
    title: "Fast exponentiation",
    prompt: "Implement pow(x, n) for a double x and integer n (which may be negative) in O(log n).",
    rubric: {
      approach: "Divide and conquer: square half power, multiply by x when n is odd",
      time: "O(log n)",
      space: "O(log n) recursive or O(1) iterative",
      criteria: ["Logarithmic, not linear", "Handles negative n via 1/x", "Correct for n = 0"],
      edgeCases: ["n = 0", "Negative n", "n at the integer minimum"],
    },
    companyTags: ["Zoho", "Goldman Sachs"],
  },
  {
    slug: "rec-subsets",
    topic: "recursion",
    difficulty: "MEDIUM",
    title: "All subsets",
    prompt: "Return every subset (the power set) of an array of distinct integers.",
    rubric: {
      approach: "Backtracking include/exclude, or iterative doubling, or bitmasks",
      time: "O(n * 2^n)",
      space: "O(n) recursion besides output",
      criteria: ["Generates exactly 2^n subsets", "Includes the empty set", "Copies the current path when recording"],
      edgeCases: ["Empty array", "Single element"],
    },
    companyTags: ["Amazon", "Meesho"],
  },
  {
    slug: "rec-permutations",
    topic: "recursion",
    difficulty: "MEDIUM",
    title: "All permutations",
    prompt: "Return every permutation of an array of distinct integers.",
    rubric: {
      approach: "Backtracking with a used[] array or in-place swaps",
      time: "O(n * n!)",
      space: "O(n) recursion besides output",
      criteria: ["Generates exactly n! permutations", "Undoes choices when backtracking", "No duplicates"],
      edgeCases: ["Single element", "Empty array"],
    },
    companyTags: ["Microsoft", "Infosys"],
  },
  {
    slug: "rec-combination-sum",
    topic: "recursion",
    difficulty: "MEDIUM",
    title: "Combinations that sum to a target",
    prompt:
      "Given distinct positive candidates and a target, return all unique combinations where chosen numbers sum to the target. A number may be used any number of times.",
    rubric: {
      approach: "Backtracking with a start index to avoid permutations of the same combination",
      time: "Exponential; pruned by sorting",
      space: "O(target / min) recursion depth",
      criteria: ["Allows reuse of the same candidate", "Avoids duplicate combinations via start index", "Prunes when sum exceeds target"],
      edgeCases: ["No combination", "Target smaller than every candidate", "Single candidate"],
    },
    companyTags: ["Amazon", "Adobe"],
  },
  {
    slug: "rec-generate-parentheses",
    topic: "recursion",
    difficulty: "MEDIUM",
    title: "Generate balanced parentheses",
    prompt: "Return all well-formed strings of n pairs of parentheses.",
    rubric: {
      approach: "Backtracking with open and close counts; add ')' only when close < open",
      time: "O(4^n / sqrt(n))",
      space: "O(n) recursion",
      criteria: ["Never produces invalid prefixes", "Generates all Catalan(n) results", "No post-filtering of invalid strings"],
      edgeCases: ["n = 0", "n = 1"],
    },
    companyTags: ["Google", "Zoho"],
  },
  {
    slug: "rec-word-search",
    topic: "recursion",
    difficulty: "MEDIUM",
    title: "Word search in a grid",
    prompt:
      "Return true if a word can be formed from sequentially adjacent (horizontal or vertical) letters in a grid, using each cell at most once.",
    rubric: {
      approach: "DFS backtracking from each cell, marking visited and restoring on return",
      time: "O(rows * cols * 3^L)",
      space: "O(L)",
      criteria: ["Marks and un-marks visited cells", "Stops early on mismatch", "Tries every starting cell"],
      edgeCases: ["Word longer than grid cells", "Single-cell grid", "Repeated letters"],
    },
    companyTags: ["Microsoft", "Amazon"],
  },
  {
    slug: "rec-n-queens",
    topic: "recursion",
    difficulty: "HARD",
    title: "N-Queens",
    prompt: "Return the number of ways to place n queens on an n x n board so that no two attack each other.",
    rubric: {
      approach: "Row-by-row backtracking with sets for columns and both diagonals",
      time: "O(n!)",
      space: "O(n)",
      criteria: ["One queen per row", "O(1) conflict checks with column/diagonal sets", "Backtracks correctly"],
      edgeCases: ["n = 1", "n = 2 and 3 (no solutions)"],
    },
    companyTags: ["Google", "Goldman Sachs"],
  },

  // --------------------------------------------------------------- hashing (7)
  {
    slug: "hash-two-sum",
    topic: "hashing",
    difficulty: "EASY",
    title: "Two sum (unsorted)",
    prompt: "Return indices of two different elements in an unsorted array that add up to a target.",
    rubric: {
      approach: "One pass with a map from value to index, checking target - x before inserting",
      time: "O(n)",
      space: "O(n)",
      criteria: ["Single pass with a hash map", "Does not reuse the same index", "Handles duplicate values"],
      edgeCases: ["Duplicates that form the answer", "Negative numbers", "No solution"],
    },
    companyTags: ["Amazon", "TCS", "Infosys"],
  },
  {
    slug: "hash-first-unique-char",
    topic: "hashing",
    difficulty: "EASY",
    title: "First non-repeating character",
    prompt: "Return the index of the first character in a string that does not repeat, or -1.",
    rubric: {
      approach: "Count frequencies, then scan for the first count of 1",
      time: "O(n)",
      space: "O(alphabet)",
      criteria: ["Two linear passes", "Returns the first by position, not by alphabet", "Returns -1 when none"],
      edgeCases: ["Empty string", "All repeating", "Single character"],
    },
    companyTags: ["Amazon", "Zoho"],
  },
  {
    slug: "hash-contains-nearby-duplicate",
    topic: "hashing",
    difficulty: "EASY",
    title: "Duplicate within distance k",
    prompt: "Return true if there are two equal values at indices i and j with |i - j| <= k.",
    rubric: {
      approach: "Map of last-seen index, or a sliding window set of size k",
      time: "O(n)",
      space: "O(min(n, k))",
      criteria: ["Checks the distance condition", "Updates last-seen index", "Linear time"],
      edgeCases: ["k = 0", "k larger than array", "No duplicates"],
    },
    companyTags: ["Microsoft", "Wipro"],
  },
  {
    slug: "hash-subarray-sum-k",
    topic: "hashing",
    difficulty: "MEDIUM",
    title: "Count subarrays that sum to k",
    prompt: "Return the number of contiguous subarrays whose sum equals k. Values may be negative.",
    rubric: {
      approach: "Prefix sums with a count map; add count[prefix - k] at each step",
      time: "O(n)",
      space: "O(n)",
      criteria: ["Seeds the map with prefix 0 -> 1", "Works with negative numbers (sliding window does not)", "Linear time"],
      edgeCases: ["k = 0", "Negative numbers", "Whole array sums to k"],
    },
    companyTags: ["Google", "Flipkart"],
  },
  {
    slug: "hash-longest-consecutive",
    topic: "hashing",
    difficulty: "MEDIUM",
    title: "Longest consecutive sequence",
    prompt: "Return the length of the longest run of consecutive integers in an unsorted array, in O(n).",
    rubric: {
      approach: "Hash set; only start counting from numbers whose predecessor is absent",
      time: "O(n)",
      space: "O(n)",
      criteria: ["Avoids sorting", "Starts only at sequence beginnings", "Handles duplicates"],
      edgeCases: ["Empty array", "Duplicates", "Negative numbers"],
    },
    companyTags: ["Amazon", "Uber"],
  },
  {
    slug: "hash-top-k-frequent",
    topic: "hashing",
    difficulty: "MEDIUM",
    title: "Top k frequent elements",
    prompt: "Return the k most frequent elements of an integer array.",
    rubric: {
      approach: "Count with a hash map, then bucket sort by frequency or use a size-k min-heap",
      time: "O(n) bucket or O(n log k) heap",
      space: "O(n)",
      criteria: ["Counts frequencies with a map", "Better than sorting all entries (bonus)", "Returns exactly k elements"],
      edgeCases: ["k equals number of distinct elements", "Ties in frequency", "Single element"],
    },
    companyTags: ["Amazon", "Meesho"],
  },
  {
    slug: "hash-distinct-in-window",
    topic: "hashing",
    difficulty: "MEDIUM",
    title: "Distinct elements in every window",
    prompt: "For every contiguous window of size k, return the number of distinct elements in it.",
    rubric: {
      approach: "Sliding window with a frequency map, removing keys when count hits 0",
      time: "O(n)",
      space: "O(k)",
      criteria: ["Updates counts incrementally", "Deletes zero-count keys", "Outputs n - k + 1 values"],
      edgeCases: ["k = 1", "k equals array length", "All equal elements"],
    },
    companyTags: ["Zoho", "Juspay"],
  },
];
