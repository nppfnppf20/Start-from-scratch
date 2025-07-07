// --- Store Update in upsertSurveyorFeedback ---
        const mappedFeedback = mapMongoId<SurveyorFeedback>(upsertedFeedback);

        console.log('[Store] Feedback received from API (mapped):', mappedFeedback);

        // Update the local store
        surveyorFeedbacks.update(feedbacks => {
            const index = feedbacks.findIndex(fb => fb.quoteId === quoteId);
            console.log(`[Store] Updating store. Found index for ${quoteId}: ${index}`);
            if (index !== -1) {
                feedbacks[index] = mappedFeedback;
            } else {
                feedbacks.push(mappedFeedback);
            }
             // Log the state right before returning it
            console.log('[Store] Store state AFTER update:', feedbacks); 
            return [...feedbacks]; // Return new array for reactivity
        });

// --- Component Log in reviews/+page.svelte ---
          <tbody>
            {#each projectQuotes as quote (quote.id)}
              {@const feedback = getFeedbackForQuote(quote.id)}
              {@const isEditing = editingQuoteId === quote.id}
              <!-- Add log here -->
              $: console.log(`[Component] Rendering row for ${quote.id}. IsEditing: ${isEditing}. Feedback:`, feedback);
              <tr class:is-editing={isEditing}>
                <td>{quote.contactName}</td>
                <!-- <td>{quote.email || 'N/A'}</td> -->

</rewritten_file> 