<?php
/**
 * Iskalni obrazec.
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

$s59dgo_id = wp_unique_id( 'iskanje-' );
?>
<form role="search" method="get" class="iskanje" action="<?php echo esc_url( home_url( '/' ) ); ?>">
	<label class="vizualno-skrito" for="<?php echo esc_attr( $s59dgo_id ); ?>"><?php esc_html_e( 'Išči po strani', 's59dgo' ); ?></label>
	<input id="<?php echo esc_attr( $s59dgo_id ); ?>" class="iskanje__polje" type="search" name="s" value="<?php echo esc_attr( get_search_query( false ) ); ?>" placeholder="<?php esc_attr_e( 'Išči …', 's59dgo' ); ?>">
	<button class="iskanje__gumb" type="submit"><?php esc_html_e( 'Išči', 's59dgo' ); ?></button>
</form>
